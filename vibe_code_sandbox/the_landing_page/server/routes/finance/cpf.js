import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const CPF_DB = () => process.env.NOTION_CPF_DB

function mapEntry(page) {
  const p = page.properties
  const oa = p.OA?.number ?? 0
  const sa = p.SA?.number ?? 0
  const ma = p.MA?.number ?? 0
  return {
    id:    page.id,
    month: p.Month?.title[0]?.plain_text ?? '',
    oa,
    sa,
    ma,
    total: p.Total?.formula?.number ?? (oa + sa + ma),
    type:  p.Type?.select?.name ?? 'monthly',
  }
}

// GET /api/finance/cpf/latest
// Returns most recent "monthly" entry; falls back to "opening" if none exists
router.get('/cpf/latest', async (req, res) => {
  try {
    const monthly = await notion.databases.query({
      database_id: CPF_DB(),
      filter: { property: 'Type', select: { equals: 'monthly' } },
      sorts:  [{ property: 'Month', direction: 'descending' }],
      page_size: 1,
    })
    if (monthly.results.length > 0) {
      return res.json({ success: true, data: mapEntry(monthly.results[0]) })
    }

    const opening = await notion.databases.query({
      database_id: CPF_DB(),
      filter: { property: 'Type', select: { equals: 'opening' } },
      page_size: 1,
    })
    const entry = opening.results[0] ? mapEntry(opening.results[0]) : null
    res.json({ success: true, data: entry })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/finance/cpf — all entries, newest first
router.get('/cpf', async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: CPF_DB(),
      sorts: [{ property: 'Month', direction: 'descending' }],
    })
    res.json({ success: true, data: response.results.map(mapEntry) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/finance/cpf — add a monthly balance update
// Body: { month: 'YYYY-MM', oa, sa, ma }
router.post('/cpf', async (req, res) => {
  try {
    const { month, oa, sa, ma } = req.body
    if (!month?.trim()) return res.status(400).json({ success: false, error: 'month is required' })

    const page = await notion.pages.create({
      parent: { database_id: CPF_DB() },
      properties: {
        Month: { title: [{ text: { content: month.trim() } }] },
        OA:    { number: parseFloat(oa) || 0 },
        SA:    { number: parseFloat(sa) || 0 },
        MA:    { number: parseFloat(ma) || 0 },
        Type:  { select: { name: 'monthly' } },
      },
    })
    res.json({ success: true, data: mapEntry(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/finance/cpf/:id
router.delete('/cpf/:id', async (req, res) => {
  try {
    await notion.pages.update({ page_id: req.params.id, archived: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
