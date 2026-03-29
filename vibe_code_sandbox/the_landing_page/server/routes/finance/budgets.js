import { Router } from 'express'
import { notion } from '../../notion.js'
import { resolveCat, buildCatMap } from './transactions.js'

const router = Router()
const BUDGETS_DB      = () => process.env.NOTION_BUDGETS_DB
const TRANSACTIONS_DB = () => process.env.NOTION_TRANSACTIONS_DB

function mapBudget(page, catMap = new Map()) {
  const p = page.properties
  // Category is the title column on the budget DB, but also handle relation just in case
  const category = resolveCat(p.Category, catMap)
                ?? Object.values(p).find(v => v.type === 'title')?.title?.[0]?.plain_text
                ?? ''
  return {
    id:           page.id,
    category,
    monthlyLimit: p['Monthly Limit']?.number ?? 0,
    type:         p.Type?.select?.name       ?? 'Soft',
  }
}

async function queryAll(dbId, filter) {
  const results = []
  let cursor
  do {
    const res = await notion.databases.query({
      database_id: dbId, filter, page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    results.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return results
}

async function getBudgetRows(catMap) {
  // Try rows explicitly marked as 'default'
  try {
    const defaults = await queryAll(BUDGETS_DB(), {
      and: [
        { property: 'Active', checkbox:  { equals: true      } },
        { property: 'Month',  rich_text: { equals: 'default' } },
      ],
    })
    if (defaults.length > 0) return defaults.map(pg => mapBudget(pg, catMap))
  } catch {}

  // Fallback: all active rows (pre-migration DBs without Month field)
  const all = await queryAll(BUDGETS_DB(), {
    property: 'Active', checkbox: { equals: true },
  })
  return all.map(pg => mapBudget(pg, catMap))
}

// GET /api/finance/budgets/summary?month=YYYY-MM
router.get('/budgets/summary', async (req, res) => {
  try {
    const { month } = req.query
    if (!month) return res.status(400).json({ success: false, error: 'month is required' })

    const [year, mon] = month.split('-').map(Number)
    const startDate   = `${month}-01`
    const lastDay     = new Date(year, mon, 0).getDate()
    const endDate     = `${month}-${String(lastDay).padStart(2, '0')}`

    // Build category map once — used by both mapBudget and transaction resolution
    const catMap = await buildCatMap()

    const [budgets, txPages] = await Promise.all([
      getBudgetRows(catMap),
      queryAll(TRANSACTIONS_DB(), {
        and: [
          { property: 'Date', date: { on_or_after:  startDate } },
          { property: 'Date', date: { on_or_before: endDate   } },
        ],
      }),
    ])

    // Only expense transactions, not bucket spends
    const txns = txPages
      .map(page => {
        const p = page.properties
        return {
          category:      resolveCat(p.Category, catMap),
          amount:        p.Amount?.number           ?? 0,
          direction:     p.Direction?.select?.name  ?? null,
          isBucketSpend: p['Is Bucket Spend']?.checkbox ?? false,
        }
      })
      .filter(tx => tx.direction !== 'Income' && !tx.isBucketSpend)

    const summary = budgets.map(budget => {
      const spent       = txns.filter(tx => tx.category === budget.category).reduce((s, tx) => s + tx.amount, 0)
      const limit       = budget.monthlyLimit
      const remaining   = limit - spent
      const percentUsed = limit > 0 ? (spent / limit) * 100 : 0

      let status
      if (limit === 0)            status = 'zero'
      else if (spent > limit)     status = 'over'
      else if (percentUsed >= 80) status = 'warning'
      else                        status = 'ok'

      return { id: budget.id, category: budget.category, monthlyLimit: limit, type: budget.type, spent, remaining, percentUsed, status }
    })

    res.json({ success: true, data: summary })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/finance/budgets/:id
router.put('/budgets/:id', async (req, res) => {
  try {
    const { monthlyLimit } = req.body
    await notion.pages.update({
      page_id: req.params.id,
      properties: { 'Monthly Limit': { number: parseFloat(monthlyLimit) || 0 } },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
