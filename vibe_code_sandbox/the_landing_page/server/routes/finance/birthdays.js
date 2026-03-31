import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const DB = () => process.env.NOTION_BIRTHDAYS_DB

export function mapBirthday(page) {
  const p = page.properties
  return {
    id:     page.id,
    name:   p.Name?.title[0]?.plain_text      ?? '',
    budget: p.Budget?.number                  ?? 0,
    month:  p.Month?.number                   ?? null,
    day:    p.Day?.number                     ?? null,
    notes:  p.Notes?.rich_text[0]?.plain_text ?? '',
  }
}

// Returns the total birthday budget for a given month number (1–12).
// Called by budgets.js to override the Birthdays category limit.
export async function getBirthdayBudgetForMonth(monthNum) {
  if (!DB()) return null
  try {
    const res = await notion.databases.query({
      database_id: DB(),
      filter: { property: 'Month', number: { equals: monthNum } },
    })
    return res.results.reduce((s, pg) => s + (pg.properties.Budget?.number ?? 0), 0)
  } catch { return null }
}

// GET /api/finance/birthdays
router.get('/birthdays', async (req, res) => {
  try {
    const res2 = await notion.databases.query({
      database_id: DB(),
      sorts: [{ property: 'Month', direction: 'ascending' }],
    })
    res.json({ success: true, data: res2.results.map(mapBirthday) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/finance/birthdays
router.post('/birthdays', async (req, res) => {
  try {
    const { name, budget, month, day, notes } = req.body
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'name is required' })
    const page = await notion.pages.create({
      parent: { database_id: DB() },
      properties: {
        Name:   { title: [{ text: { content: name.trim() } }] },
        Budget: { number: parseFloat(budget) || 0 },
        ...(month != null ? { Month: { number: parseInt(month, 10) } } : {}),
        ...(day   != null ? { Day:   { number: parseInt(day,   10) } } : {}),
        Notes:  { rich_text: notes ? [{ text: { content: notes } }] : [] },
      },
    })
    res.json({ success: true, data: mapBirthday(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/finance/birthdays/:id
router.delete('/birthdays/:id', async (req, res) => {
  try {
    await notion.pages.update({ page_id: req.params.id, archived: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
