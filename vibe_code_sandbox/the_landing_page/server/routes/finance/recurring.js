import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const RECURRING_DB    = () => process.env.NOTION_RECURRING_DB
const TRANSACTIONS_DB = () => process.env.NOTION_TRANSACTIONS_DB

// ── Schema caches ─────────────────────────────────────────────────
// Recurring schema is NOT cached — the DB evolves as users add properties,
// and stale cache silently drops fields like Direction.
async function getRecurringSchema() {
  const db = await notion.databases.retrieve({ database_id: RECURRING_DB() })
  return new Set(Object.keys(db.properties))
}

// Transactions schema is stable and high-traffic — cache it.
let _txSchema = null
async function getTxSchema() {
  if (_txSchema) return _txSchema
  const db = await notion.databases.retrieve({ database_id: TRANSACTIONS_DB() })
  _txSchema = new Set(Object.keys(db.properties))
  return _txSchema
}

function mapRecurring(page) {
  const p = page.properties
  return {
    id:             page.id,
    name:           p.Name?.title[0]?.plain_text ?? '',
    amount:         p.Amount?.number ?? null,
    frequency:      p.Frequency?.select?.name ?? null,
    direction:      p.Direction?.select?.name ?? null,
    merchant:       p.Merchant?.rich_text[0]?.plain_text ?? '',
    category:       p.Category?.select?.name ?? null,
    source:         p.Source?.select?.name ?? null,
    isPendingMatcha: p['Is Pending Matcha']?.checkbox ?? false,
    day:            p.Day?.number ?? null,
    notes:          p.Notes?.rich_text[0]?.plain_text ?? '',
    active:         p.Active?.checkbox ?? true,
  }
}

// GET /api/finance/recurring — returns all recurring items
router.get('/recurring', async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: RECURRING_DB(),
      sorts: [{ property: 'Name', direction: 'ascending' }],
    })
    res.json({ success: true, data: response.results.map(mapRecurring) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/finance/recurring
router.post('/recurring', async (req, res) => {
  try {
    const { name, amount, frequency, direction = 'Expense', merchant, category, source, isPendingMatcha, day, notes } = req.body
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'name is required' })

    const schema = await getRecurringSchema()

    const properties = {
      Name:      { title: [{ text: { content: name.trim() } }] },
      Amount:    { number: amount != null && amount !== '' ? parseFloat(amount) : null },
      ...(schema.has('Frequency')         && frequency                  ? { Frequency:           { select: { name: frequency } } }   : {}),
      ...(schema.has('Direction')                                        ? { Direction:           { select: { name: direction } } }   : {}),
      ...(schema.has('Notes')                                            ? { Notes:               { rich_text: notes ? [{ text: { content: notes } }] : [] } } : {}),
      ...(schema.has('Active')                                           ? { Active:              { checkbox: true } }                : {}),
      ...(schema.has('Merchant')          && merchant                   ? { Merchant:            { rich_text: [{ text: { content: merchant } }] } } : {}),
      ...(schema.has('Category')          && category                   ? { Category:            { select: { name: category } } }    : {}),
      ...(schema.has('Source')            && source                     ? { Source:              { select: { name: source } } }      : {}),
      ...(schema.has('Is Pending Matcha')                                    ? { 'Is Pending Matcha': { checkbox: isPendingMatcha ?? false } }             : {}),
      ...(schema.has('Day')               && day != null && day !== ''      ? { Day:                 { number: parseInt(day, 10) } }                        : {}),
    }

    const page = await notion.pages.create({ parent: { database_id: RECURRING_DB() }, properties })
    res.json({ success: true, data: mapRecurring(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/finance/recurring/:id
router.delete('/recurring/:id', async (req, res) => {
  try {
    await notion.pages.update({ page_id: req.params.id, archived: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/finance/recurring/:id/log
// Body: { month?: 'YYYY-MM' }  — omit to use current month
router.post('/recurring/:id/log', async (req, res) => {
  try {
    const recurringPage = await notion.pages.retrieve({ page_id: req.params.id })
    const item   = mapRecurring(recurringPage)
    const schema = await getTxSchema()

    const now = new Date()
    let year, month
    if (req.body?.month) {
      ;[year, month] = req.body.month.split('-').map(Number)
    } else {
      year  = now.getFullYear()
      month = now.getMonth() + 1
    }
    const lastDay = new Date(year, month, 0).getDate()
    const logDay  = item.day ? Math.min(item.day, lastDay) : (req.body?.month ? 1 : now.getDate())
    const today   = `${year}-${String(month).padStart(2, '0')}-${String(logDay).padStart(2, '0')}`

    const titleProp = schema.has('Title') ? 'Title' : 'Name'

    const properties = {
      [titleProp]:         { title: [{ text: { content: item.name } }] },
      Date:                { date: { start: today } },
      Amount:              { number: item.amount ?? 0 },
      Direction:           { select: { name: item.direction } },
      Notes:               { rich_text: item.notes ? [{ text: { content: item.notes } }] : [] },
      'Is Pending Matcha': { checkbox: item.isPendingMatcha },
      'Is Bucket Spend':   { checkbox: false },
      'Auto Parsed':       { checkbox: false },
      'Needs Review':      { checkbox: item.amount === null },
      ...(schema.has('Merchant')    && item.merchant    ? { Merchant:    { rich_text: [{ text: { content: item.merchant } }] } } : {}),
      ...(schema.has('Category')    && item.category    ? { Category:    { select: { name: item.category } } }    : {}),
      ...(schema.has('Source')      && item.source      ? { Source:      { select: { name: item.source } } }      : {}),
    }

    const tx = await notion.pages.create({ parent: { database_id: TRANSACTIONS_DB() }, properties })

    const p = tx.properties
    res.json({
      success: true,
      data: {
        id:             tx.id,
        title:          (p.Title ?? p.Name)?.title[0]?.plain_text ?? '',
        merchant:       p.Merchant?.rich_text[0]?.plain_text ?? '',
        date:           p.Date?.date?.start ?? null,
        amount:         p.Amount?.number ?? 0,
        direction:      p.Direction?.select?.name ?? null,
        category:       p.Category?.select?.name ?? null,
        source:         p.Source?.select?.name ?? null,
        isPendingMatcha: p['Is Pending Matcha']?.checkbox ?? false,
        isBucketSpend:   p['Is Bucket Spend']?.checkbox ?? false,
        notes:          p.Notes?.rich_text[0]?.plain_text ?? '',
        needsReview:    p['Needs Review']?.checkbox ?? false,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
