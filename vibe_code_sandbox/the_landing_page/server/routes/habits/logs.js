/**
 * Habit Logs DB schema (create in Notion):
 *   Habit   relation → Habits DB
 *   Date    date
 *   Status  select   — Completed | Missed | Skipped
 *   Value   number   — for quantitative habits
 *   Notes   rich_text
 */
import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const DB = () => process.env.NOTION_HABIT_LOGS_DB

async function queryAll(dbId, filter, sorts) {
  if (!dbId) return []
  const results = []
  let cursor
  do {
    const params = { database_id: dbId, page_size: 100 }
    if (filter) params.filter = filter
    if (sorts)  params.sorts  = sorts
    if (cursor) params.start_cursor = cursor
    const res = await notion.databases.query(params)
    results.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return results
}

function mapLog(page) {
  const p = page.properties
  return {
    id:       page.id,
    habitId:  p.Habit?.relation?.[0]?.id  ?? null,
    date:     p.Date?.date?.start         ?? null,
    status:   p.Status?.select?.name      ?? 'Completed',
    value:    p.Value?.number             ?? null,
    notes:    p.Notes?.rich_text?.[0]?.plain_text ?? '',
    createdAt: page.created_time,
  }
}

function buildLogProps({ habitId, date, status, value, notes }) {
  const props = {}
  if (habitId) props.Habit  = { relation: [{ id: habitId }] }
  if (date)    props.Date   = { date: { start: date } }
  if (status)  props.Status = { select: { name: status } }
  props.Value = value != null ? { number: value } : { number: null }
  props.Notes = { rich_text: notes ? [{ text: { content: notes } }] : [] }
  return props
}

// GET /api/habits/logs?habitId=&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/logs', async (req, res) => {
  if (!DB()) return res.json({ success: true, data: [] })
  try {
    const { habitId, from, to } = req.query
    const filters = []
    if (habitId) filters.push({ property: 'Habit', relation: { contains: habitId } })
    if (from)    filters.push({ property: 'Date',  date: { on_or_after:  from } })
    if (to)      filters.push({ property: 'Date',  date: { on_or_before: to   } })
    const filter = filters.length === 0 ? undefined
      : filters.length === 1 ? filters[0]
      : { and: filters }
    const pages = await queryAll(DB(), filter, [{ property: 'Date', direction: 'descending' }])
    res.json({ success: true, data: pages.map(mapLog) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/habits/logs  — upserts: one log per habit per date
// Body: { habitId, date, status, value?, notes? }
router.post('/logs', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'NOTION_HABIT_LOGS_DB not set' })
  try {
    const { habitId, date, status = 'Completed', value, notes } = req.body
    if (!habitId || !date)
      return res.status(400).json({ success: false, error: 'habitId and date are required' })

    const existing = await queryAll(DB(), {
      and: [
        { property: 'Habit', relation: { contains: habitId } },
        { property: 'Date',  date: { equals: date } },
      ],
    })

    let page
    if (existing.length > 0) {
      page = await notion.pages.update({
        page_id: existing[0].id,
        properties: buildLogProps({ status, value, notes }),
      })
    } else {
      page = await notion.pages.create({
        parent: { database_id: DB() },
        properties: buildLogProps({ habitId, date, status, value, notes }),
      })
    }
    res.json({ success: true, data: mapLog(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/habits/logs/:id  — remove a specific log entry (undo)
router.delete('/logs/:id', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'NOTION_HABIT_LOGS_DB not set' })
  try {
    await notion.pages.update({ page_id: req.params.id, archived: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/habits/logs/:id  — update notes only (status/value immutable after log)
router.patch('/logs/:id', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'NOTION_HABIT_LOGS_DB not set' })
  try {
    const { notes } = req.body
    const page = await notion.pages.update({
      page_id: req.params.id,
      properties: { Notes: { rich_text: notes ? [{ text: { content: notes } }] : [] } },
    })
    res.json({ success: true, data: mapLog(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/habits/logs/batch
// Body: { entries: [{ habitId, date, status, value?, notes? }] }
router.post('/logs/batch', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'NOTION_HABIT_LOGS_DB not set' })
  try {
    const { entries } = req.body
    if (!Array.isArray(entries) || entries.length === 0)
      return res.status(400).json({ success: false, error: 'entries array required' })

    const results = await Promise.all(entries.map(async entry => {
      const { habitId, date, status = 'Completed', value, notes } = entry
      const existing = await queryAll(DB(), {
        and: [
          { property: 'Habit', relation: { contains: habitId } },
          { property: 'Date',  date: { equals: date } },
        ],
      })
      if (existing.length > 0) {
        return notion.pages.update({
          page_id: existing[0].id,
          properties: buildLogProps({ status, value, notes }),
        })
      }
      return notion.pages.create({
        parent: { database_id: DB() },
        properties: buildLogProps({ habitId, date, status, value, notes }),
      })
    }))
    res.json({ success: true, data: results.map(mapLog) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
