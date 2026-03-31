import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const PAYBACK_DB = () => process.env.NOTION_PAYBACK_DB

function mapPayback(page) {
  const p = page.properties
  return {
    id:           page.id,
    name:         p.Name?.title[0]?.plain_text ?? '',
    amount:       p.Amount?.number ?? 0,
    remaining:    p.Remaining?.number ?? 0,
    sourceBucket: p['Source Bucket']?.rich_text[0]?.plain_text ?? '',
    date:         p.Date?.date?.start ?? null,
    status:       p.Status?.select?.name ?? 'Active',
    notes:        p.Notes?.rich_text[0]?.plain_text ?? '',
  }
}

// GET /api/finance/payback — list active items
router.get('/payback', async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: PAYBACK_DB(),
      filter: { property: 'Status', select: { equals: 'Active' } },
      sorts: [{ property: 'Date', direction: 'descending' }],
    })
    res.json({ success: true, data: response.results.map(mapPayback) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/finance/payback — create item
router.post('/payback', async (req, res) => {
  try {
    const { name, amount, sourceBucket, date, notes } = req.body
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'name is required' })
    if (!amount || isNaN(parseFloat(amount))) return res.status(400).json({ success: false, error: 'amount is required' })

    const amt = parseFloat(amount)
    const page = await notion.pages.create({
      parent: { database_id: PAYBACK_DB() },
      properties: {
        Name:            { title: [{ text: { content: name.trim() } }] },
        Amount:          { number: amt },
        Remaining:       { number: amt },
        'Source Bucket': { rich_text: sourceBucket ? [{ text: { content: sourceBucket } }] : [] },
        Date:            { date: { start: date ?? new Date().toISOString().slice(0, 10) } },
        Status:          { select: { name: 'Active' } },
        Notes:           { rich_text: notes ? [{ text: { content: notes } }] : [] },
      },
    })
    res.json({ success: true, data: mapPayback(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/finance/payback/:id/repay — apply a payment
// Body: { amount: number }
router.post('/payback/:id/repay', async (req, res) => {
  try {
    const payment = parseFloat(req.body?.amount)
    if (isNaN(payment) || payment <= 0) return res.status(400).json({ success: false, error: 'amount must be positive' })

    const existing = await notion.pages.retrieve({ page_id: req.params.id })
    const item = mapPayback(existing)

    const newRemaining = Math.max(0, item.remaining - payment)
    const nowRepaid    = newRemaining === 0

    const updated = await notion.pages.update({
      page_id: req.params.id,
      properties: {
        Remaining: { number: newRemaining },
        ...(nowRepaid ? { Status: { select: { name: 'Repaid' } } } : {}),
      },
    })
    res.json({ success: true, data: mapPayback(updated), repaid: nowRepaid })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/finance/payback/:id — archive
router.delete('/payback/:id', async (req, res) => {
  try {
    await notion.pages.update({ page_id: req.params.id, archived: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
