import { Router } from 'express'
import { notion } from '../../notion.js'
import { resolveCat, buildCatMap } from './transactions.js'
import { getBirthdayBudgetForMonth } from './birthdays.js'

const router = Router()
const BUDGETS_DB      = () => process.env.NOTION_BUDGETS_DB
const TRANSACTIONS_DB = () => process.env.NOTION_TRANSACTIONS_DB
const PLANS_DB        = () => process.env.NOTION_REDUCTION_PLANS_DB
const LINES_DB        = () => process.env.NOTION_REDUCTION_LINES_DB

// Simple in-memory cache with TTL
const _cache = new Map()
function withCache(key, ttlMs, fn) {
  const hit = _cache.get(key)
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.val)
  return fn().then(val => { _cache.set(key, { val, ts: Date.now() }); return val })
}

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

// Returns { categoryLower → reducedLimit } for any active plan covering `month`
async function getReductionOverrides(month) {
  if (!PLANS_DB() || !LINES_DB()) return {}
  try {
    const monthStart = `${month}-01`
    const plans = await queryAll(PLANS_DB(), {
      and: [
        { property: 'Status',      select: { equals: 'Active'           } },
        { property: 'Start Month', date:   { on_or_before: monthStart   } },
        { property: 'End Month',   date:   { on_or_after:  monthStart   } },
      ],
    })
    if (!plans.length) return {}
    const overrides = {}
    for (const plan of plans) {
      const lines = await queryAll(LINES_DB(), {
        property: 'Plan', relation: { contains: plan.id },
      })
      for (const line of lines) {
        const p   = line.properties
        const cat = p.Category?.select?.name?.toLowerCase()
        const lim = p['Reduced Limit']?.number ?? 0
        if (cat) overrides[cat] = lim
      }
    }
    return overrides
  } catch { return {} }
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

// GET /api/finance/budgets/debug?month=YYYY-MM  — raw diagnostic data
router.get('/budgets/debug', async (req, res) => {
  try {
    const { month = new Date().toISOString().slice(0, 7) } = req.query
    const [year, mon] = month.split('-').map(Number)
    const startDate = `${month}-01`
    const endDate   = `${month}-${String(new Date(year, mon, 0).getDate()).padStart(2, '0')}`

    const catMap = await buildCatMap()
    const budgetPages = await queryAll(BUDGETS_DB(), { property: 'Active', checkbox: { equals: true } })

    // Fetch a few transactions regardless of date to inspect property structure
    const anyTxRes = await notion.databases.query({ database_id: TRANSACTIONS_DB(), page_size: 3 })

    res.json({
      catMapSize: catMap.size,
      budgetCategories: budgetPages.map(pg => ({
        resolved: resolveCat(pg.properties.Category, catMap)
            ?? Object.values(pg.properties).find(v => v.type === 'title')?.title?.[0]?.plain_text,
      })),
      transactionPropertyKeys: anyTxRes.results[0] ? Object.entries(anyTxRes.results[0].properties).map(([k, v]) => ({ key: k, type: v.type })) : [],
      transactionSample: anyTxRes.results.slice(0, 3).map(pg => {
        const p = pg.properties
        return {
          allProps: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { type: v.type, value: v[v.type] }])),
        }
      }),
    })
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack })
  }
})

// GET /api/finance/budgets/summary?month=YYYY-MM
router.get('/budgets/summary', async (req, res) => {
  try {
    const { month } = req.query
    if (!month) return res.status(400).json({ success: false, error: 'month is required' })

    const [year, mon] = month.split('-').map(Number)
    const startDate   = `${month}-01`
    const lastDay     = new Date(year, mon, 0).getDate()
    const endDate     = `${month}-${String(lastDay).padStart(2, '0')}`

    const catMap = await withCache('catMap', 2 * 60_000, () => buildCatMap())

    const monthNum = parseInt(mon, 10)
    const [budgets, txPages, reductionOverrides, birthdayBudget] = await Promise.all([
      withCache(`budgets`, 2 * 60_000, () => getBudgetRows(catMap)),
      queryAll(TRANSACTIONS_DB(), {
        and: [
          { property: 'Date', date: { on_or_after:  startDate } },
          { property: 'Date', date: { on_or_before: endDate   } },
        ],
      }),
      withCache(`reductions:${month}`, 2 * 60_000, () => getReductionOverrides(month)),
      withCache(`birthdays:${monthNum}`, 2 * 60_000, () => getBirthdayBudgetForMonth(monthNum)),
    ])

    const allMapped = txPages.map(page => {
      const p = page.properties
      const category = resolveCat(p.Category, catMap)
                    ?? Object.values(p).find(v => v.type === 'title')?.title?.[0]?.plain_text
                    ?? null
      return {
        category,
        amount:        p.Amount?.number              ?? 0,
        direction:     p.Direction?.select?.name     ?? null,
        isBucketSpend: p['Is Bucket Spend']?.checkbox ?? false,
      }
    })

    const monthIncome = allMapped
      .filter(tx => tx.direction === 'Income')
      .reduce((s, tx) => s + tx.amount, 0)

    const txns = allMapped.filter(tx => tx.direction !== 'Income' && !tx.isBucketSpend)

    const summary = budgets.map(budget => {
      const budgetCat = budget.category.toLowerCase()
      const spent     = txns
        .filter(tx => tx.category != null && tx.category.toLowerCase() === budgetCat)
        .reduce((s, tx) => s + tx.amount, 0)
      // Birthdays category: limit comes from the Birthdays DB for this month
      const isBirthdays = budgetCat === 'birthdays' || budgetCat === 'birthday'
      const limit = isBirthdays && birthdayBudget !== null && birthdayBudget > 0
        ? birthdayBudget
        : (reductionOverrides[budgetCat] ?? budget.monthlyLimit)
      const remaining   = limit - spent
      const percentUsed = limit > 0 ? (spent / limit) * 100 : 0

      let status
      if (limit === 0)            status = 'zero'
      else if (spent > limit)     status = 'over'
      else if (percentUsed >= 80) status = 'warning'
      else                        status = 'ok'

      return { id: budget.id, category: budget.category, monthlyLimit: limit, type: budget.type, spent, remaining, percentUsed, status }
    })

    // ── Reconcile: any spend not matched to a budget row ─────────────
    // This covers transactions whose category resolved to null (e.g. broken
    // relation), OR whose category simply has no budget row.
    const totalExpenses   = txns.reduce((s, tx) => s + tx.amount, 0)
    const budgetCovered   = summary.reduce((s, b) => s + b.spent, 0)
    const uncategorized   = Math.round((totalExpenses - budgetCovered) * 100) / 100

    if (uncategorized > 0.005) {
      summary.push({
        id:           '__uncategorized__',
        category:     'Uncategorized',
        monthlyLimit: 0,
        type:         'Soft',
        spent:        uncategorized,
        remaining:    -uncategorized,
        percentUsed:  100,
        status:       'zero',
      })
    }

    res.json({ success: true, data: summary, income: monthIncome, totalExpenses })
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
