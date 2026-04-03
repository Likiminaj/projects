/**
 * Habits DB schema (create in Notion):
 *   Name           title
 *   Category       select   — Health | Work | Personal | Learning | Finance | Social | Mindfulness
 *   Type           select   — Binary | Quantitative
 *   Target Value   number   — e.g. 10000 (for quantitative)
 *   Target Unit    rich_text — e.g. "steps"
 *   Cadence        select   — Daily | Weekly | Custom
 *   Cadence Days   multi_select — Mon | Tue | Wed | Thu | Fri | Sat | Sun
 *   Start Date     date
 *   End Date       date
 *   Status         select   — Active | Archived
 *   Importance     number   — 1–5
 *   Notes          rich_text
 */
import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const DB = () => process.env.NOTION_HABITS_DB

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

function mapHabit(page) {
  const p = page.properties
  return {
    id:           page.id,
    name:         p.Name?.title?.[0]?.plain_text    ?? '',
    category:     p.Category?.select?.name          ?? null,
    type:         p.Type?.select?.name              ?? 'Binary',
    targetValue:  p['Target Value']?.number         ?? null,
    targetUnit:   p['Target Unit']?.rich_text?.[0]?.plain_text ?? '',
    cadence:      p.Cadence?.select?.name           ?? 'Daily',
    cadenceDays:  p['Cadence Days']?.multi_select?.map(o => o.name) ?? [],
    startDate:    p['Start Date']?.date?.start      ?? null,
    endDate:      p['End Date']?.date?.start        ?? null,
    status:       p.Status?.select?.name            ?? 'Active',
    importance:   p.Importance?.number              ?? 3,
    notes:        p.Notes?.rich_text?.[0]?.plain_text ?? '',
    createdAt:    page.created_time,
  }
}

function buildProps(fields) {
  const props = {}
  if (fields.name !== undefined)
    props.Name = { title: [{ text: { content: fields.name } }] }
  if (fields.category !== undefined)
    props.Category = fields.category ? { select: { name: fields.category } } : { select: null }
  if (fields.type !== undefined)
    props.Type = { select: { name: fields.type } }
  if (fields.targetValue !== undefined)
    props['Target Value'] = fields.targetValue != null ? { number: fields.targetValue } : { number: null }
  if (fields.targetUnit !== undefined)
    props['Target Unit'] = { rich_text: fields.targetUnit ? [{ text: { content: fields.targetUnit } }] : [] }
  if (fields.cadence !== undefined)
    props.Cadence = { select: { name: fields.cadence } }
  if (fields.cadenceDays !== undefined)
    props['Cadence Days'] = { multi_select: (fields.cadenceDays ?? []).map(d => ({ name: d })) }
  if (fields.startDate !== undefined)
    props['Start Date'] = fields.startDate ? { date: { start: fields.startDate } } : { date: null }
  if (fields.endDate !== undefined)
    props['End Date'] = fields.endDate ? { date: { start: fields.endDate } } : { date: null }
  if (fields.status !== undefined)
    props.Status = { select: { name: fields.status } }
  if (fields.importance !== undefined)
    props.Importance = { number: fields.importance }
  if (fields.notes !== undefined)
    props.Notes = { rich_text: fields.notes ? [{ text: { content: fields.notes } }] : [] }
  return props
}

// GET /api/habits?status=Active|Archived|all
router.get('/', async (req, res) => {
  if (!DB()) return res.json({ success: true, data: [] })
  try {
    const { status = 'Active' } = req.query
    const filter = status === 'all' ? undefined
      : { property: 'Status', select: { equals: status } }
    const pages = await queryAll(DB(), filter, [{ property: 'Name', direction: 'ascending' }])
    res.json({ success: true, data: pages.map(mapHabit) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/habits
router.post('/', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'NOTION_HABITS_DB not set' })
  try {
    const page = await notion.pages.create({
      parent: { database_id: DB() },
      properties: buildProps({ ...req.body, status: 'Active' }),
    })
    res.json({ success: true, data: mapHabit(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/habits/:id
router.patch('/:id', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'NOTION_HABITS_DB not set' })
  try {
    const page = await notion.pages.update({
      page_id: req.params.id,
      properties: buildProps(req.body),
    })
    res.json({ success: true, data: mapHabit(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/habits/:id  body: { mode: 'archive' | 'delete' }
router.delete('/:id', async (req, res) => {
  if (!DB()) return res.status(500).json({ success: false, error: 'NOTION_HABITS_DB not set' })
  try {
    const { mode = 'archive' } = req.body
    if (mode === 'delete') {
      await notion.pages.update({ page_id: req.params.id, archived: true })
    } else {
      await notion.pages.update({
        page_id: req.params.id,
        properties: buildProps({ status: 'Archived' }),
      })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
