import { Router } from 'express'
import { notion } from '../notion.js'

const router = Router()
const DB = () => process.env.NOTION_TASKS_DB

// ── Map Notion page → plain object ────────────────────────────────
function mapTask(page) {
  const p = page.properties
  return {
    id:             page.id,
    name:           p.Name?.title?.[0]?.plain_text ?? '',
    status:         p.Status?.select?.name ?? null,
    priority:       p.Priority?.select?.name ?? null,
    area:           p.Area?.select?.name ?? null,
    dueDate:        p['Due Date']?.date?.start ?? null,
    completedAt:    p['Completed At']?.date?.start ?? null,
    notes:          p.Notes?.rich_text?.[0]?.plain_text ?? '',
    recurring:      p.Recurring?.checkbox ?? false,
    recurFrequency: p['Recur Frequency']?.select?.name ?? null,
  }
}

// ── Sort tasks: due date asc (nulls last), then priority ──────────
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const aDate = a.dueDate
    const bDate = b.dueDate
    if (aDate && bDate) {
      if (aDate < bDate) return -1
      if (aDate > bDate) return 1
    } else if (aDate) {
      return -1
    } else if (bDate) {
      return 1
    }
    const ap = PRIORITY_ORDER[a.priority] ?? 99
    const bp = PRIORITY_ORDER[b.priority] ?? 99
    return ap - bp
  })
}

// ── Fetch all pages with optional filters ─────────────────────────
async function fetchAll(filters = []) {
  const results = []
  let cursor
  do {
    const res = await notion.databases.query({
      database_id: DB(),
      page_size: 100,
      filter: filters.length > 0
        ? (filters.length === 1 ? filters[0] : { and: filters })
        : undefined,
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    results.push(...res.results)
    cursor = res.has_more ? res.next_cursor : null
  } while (cursor)
  return results
}

// ── Build Notion properties object from field map ─────────────────
function buildProps(fields) {
  const props = {}

  if (fields.name !== undefined) {
    props.Name = { title: [{ text: { content: fields.name } }] }
  }
  if (fields.status !== undefined) {
    props.Status = { select: { name: fields.status } }
  }
  if (fields.priority !== undefined) {
    props.Priority = { select: { name: fields.priority } }
  }
  if (fields.area !== undefined) {
    props.Area = fields.area ? { select: { name: fields.area } } : { select: null }
  }
  if (fields.dueDate !== undefined) {
    props['Due Date'] = fields.dueDate ? { date: { start: fields.dueDate } } : { date: null }
  }
  if (fields.completedAt !== undefined) {
    props['Completed At'] = fields.completedAt
      ? { date: { start: fields.completedAt } }
      : { date: null }
  }
  if (fields.notes !== undefined) {
    props.Notes = {
      rich_text: fields.notes ? [{ text: { content: fields.notes } }] : [],
    }
  }
  if (fields.recurring !== undefined) {
    props.Recurring = { checkbox: !!fields.recurring }
  }
  if (fields.recurFrequency !== undefined) {
    props['Recur Frequency'] = fields.recurFrequency
      ? { select: { name: fields.recurFrequency } }
      : { select: null }
  }
  return props
}

// ── Compute next due date for recurring tasks ─────────────────────
function nextDueDate(freq) {
  const d = new Date()
  if (freq === 'Daily')   d.setDate(d.getDate() + 1)
  else if (freq === 'Weekly')  d.setDate(d.getDate() + 7)
  else if (freq === 'Monthly') d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

// ── GET /tasks ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  if (!DB()) return res.json({ success: true, data: [] })

  try {
    const { status, area, priority, dueBefore } = req.query
    const realFilters = []

    if (status)    realFilters.push({ property: 'Status',   select: { equals: status } })
    if (area)      realFilters.push({ property: 'Area',     select: { equals: area } })
    if (priority)  realFilters.push({ property: 'Priority', select: { equals: priority } })
    if (dueBefore) realFilters.push({ property: 'Due Date', date: { before: dueBefore } })

    const pages = await fetchAll(realFilters)
    const tasks = sortTasks(pages.map(mapTask))
    res.json({ success: true, data: tasks })
  } catch (err) {
    console.error('GET /tasks error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /tasks ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'Tasks DB not configured' })

  try {
    const { name, priority, area, dueDate, notes, recurring, recurFrequency } = req.body

    const page = await notion.pages.create({
      parent: { database_id: DB() },
      properties: buildProps({
        name:           name ?? '',
        status:         'Todo',
        priority:       priority ?? 'Medium',
        area:           area ?? null,
        dueDate:        dueDate ?? null,
        notes:          notes ?? '',
        recurring:      recurring ?? false,
        recurFrequency: recurFrequency ?? null,
      }),
    })

    res.json({ success: true, data: mapTask(page) })
  } catch (err) {
    console.error('POST /tasks error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /tasks/:id ──────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'Tasks DB not configured' })

  try {
    const { id } = req.params
    const body = req.body

    // Fetch current task to check recurring status
    const existing = await notion.pages.retrieve({ page_id: id })
    const current  = mapTask(existing)

    const updates = { ...body }
    const today   = new Date().toISOString().slice(0, 10)

    // Auto-manage Completed At
    if (updates.status === 'Done' || updates.status === 'Dropped') {
      if (!updates.completedAt) updates.completedAt = today
    } else if (updates.status === 'Todo' || updates.status === 'In Progress') {
      updates.completedAt = null
    }

    const page = await notion.pages.update({
      page_id:    id,
      properties: buildProps(updates),
    })

    const updated = mapTask(page)

    // If Done + recurring → create new task
    if (updates.status === 'Done') {
      const isRecurring = updates.recurring !== undefined ? updates.recurring : current.recurring
      const freq        = updates.recurFrequency ?? current.recurFrequency

      if (isRecurring && freq) {
        const nextDue = nextDueDate(freq)
        await notion.pages.create({
          parent: { database_id: DB() },
          properties: buildProps({
            name:           current.name,
            status:         'Todo',
            priority:       current.priority,
            area:           current.area,
            dueDate:        nextDue,
            notes:          current.notes,
            recurring:      true,
            recurFrequency: freq,
          }),
        })
        updated.recurring = true
      }
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('PATCH /tasks/:id error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /tasks/:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'Tasks DB not configured' })

  try {
    await notion.pages.update({ page_id: req.params.id, archived: true })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /tasks/:id error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
