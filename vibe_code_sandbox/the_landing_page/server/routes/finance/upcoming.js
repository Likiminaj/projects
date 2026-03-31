import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const UPCOMING_DB  = () => process.env.NOTION_UPCOMING_DB
const RECURRING_DB = () => process.env.NOTION_RECURRING_DB
const BUCKETS_DB   = () => process.env.NOTION_BUCKETS_DB

async function queryAll(dbId, filter) {
  const results = []
  let cursor
  do {
    const params = { database_id: dbId, page_size: 100 }
    if (filter) params.filter = filter
    if (cursor) params.start_cursor = cursor
    const res = await notion.databases.query(params)
    results.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return results
}

// GET /api/finance/upcoming?month=YYYY-MM
// Combines: one-offs due this month + recurring expenses due this month + active bucket top-ups
router.get('/upcoming', async (req, res) => {
  try {
    const { month } = req.query
    if (!month) return res.status(400).json({ success: false, error: 'month is required' })

    const [year, mon] = month.split('-').map(Number)
    const lastDay   = new Date(year, mon, 0).getDate()
    const startDate = `${month}-01`
    const endDate   = `${month}-${String(lastDay).padStart(2, '0')}`

    const items = []

    // 1. Upcoming one-offs where Due Date falls in this month
    if (UPCOMING_DB()) {
      try {
        const pages = await notion.databases.query({
          database_id: UPCOMING_DB(),
          filter: {
            and: [
              { property: 'Due Date', date: { on_or_after:  startDate } },
              { property: 'Due Date', date: { on_or_before: endDate   } },
            ],
          },
          sorts: [{ property: 'Due Date', direction: 'ascending' }],
        })
        for (const page of pages.results) {
          const p = page.properties
          items.push({
            id:      page.id,
            name:    p.Name?.title[0]?.plain_text      ?? '',
            amount:  p['Estimated Amount']?.number     ?? null,
            dueDate: p['Due Date']?.date?.start        ?? null,
            source:  'one-off',
          })
        }
      } catch {}
    }

    // 2. Active recurring expenses due this month
    if (RECURRING_DB()) {
      try {
        const pages = await queryAll(RECURRING_DB(), {
          property: 'Active', checkbox: { equals: true },
        })
        for (const page of pages) {
          const p = page.properties
          const direction = p.Direction?.select?.name ?? 'Expense'
          if (direction !== 'Expense') continue

          const frequency   = p.Frequency?.select?.name
          const yearlyMonth = p.Month?.number ?? null
          const isDue = frequency === 'Monthly'
            || (frequency === 'Yearly' && yearlyMonth === mon)
          if (!isDue) continue

          const day    = p.Day?.number ?? null
          const dueDay = day ? Math.min(day, lastDay) : lastDay
          const dueDate = `${month}-${String(dueDay).padStart(2, '0')}`

          items.push({
            id:      page.id,
            name:    p.Name?.title[0]?.plain_text ?? '',
            amount:  p.Amount?.number             ?? null,
            dueDate,
            source: 'recurring',
          })
        }
      } catch {}
    }

    // 3. Active buckets with a monthly top-up > 0
    if (BUCKETS_DB()) {
      try {
        const pages = await queryAll(BUCKETS_DB(), {
          property: 'Status', select: { equals: 'Active' },
        })
        for (const page of pages) {
          const p          = page.properties
          const monthlyTopUp = p['Monthly Top Up']?.number ?? 0
          if (monthlyTopUp <= 0) continue
          items.push({
            id:      page.id,
            name:    `${p.Name?.title?.[0]?.plain_text ?? ''} top-up`,
            amount:  monthlyTopUp,
            dueDate: endDate,
            source:  'bucket',
          })
        }
      } catch {}
    }

    // Sort by due date ascending
    items.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate < b.dueDate ? -1 : 1
    })

    res.json({ success: true, data: items })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/finance/upcoming
router.post('/upcoming', async (req, res) => {
  try {
    if (!UPCOMING_DB()) {
      return res.status(503).json({ success: false, error: 'Upcoming DB not configured. Run setup-upcoming-db.' })
    }
    const { name, estimatedAmount, dueDate, category, repeatYearly } = req.body
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'name is required' })

    const page = await notion.pages.create({
      parent: { database_id: UPCOMING_DB() },
      properties: {
        Name:              { title: [{ text: { content: name.trim() } }] },
        ...(estimatedAmount != null ? { 'Estimated Amount': { number: parseFloat(estimatedAmount) || 0 } } : {}),
        ...(dueDate                 ? { 'Due Date':         { date: { start: dueDate } } } : {}),
        ...(category                ? { Category:           { select: { name: category } } } : {}),
        'Repeat Yearly':   { checkbox: repeatYearly ?? false },
      },
    })
    const p = page.properties
    res.json({
      success: true,
      data: {
        id:      page.id,
        name:    p.Name?.title[0]?.plain_text      ?? '',
        amount:  p['Estimated Amount']?.number     ?? null,
        dueDate: p['Due Date']?.date?.start        ?? null,
        source:  'one-off',
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
