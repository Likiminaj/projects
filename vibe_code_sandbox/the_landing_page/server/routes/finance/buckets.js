import { Router } from 'express'
import { notion } from '../../notion.js'

const router     = Router()
const DB         = () => process.env.NOTION_BUCKETS_DB
const BUDGETS_DB = () => process.env.NOTION_BUDGETS_DB
const PLANS_DB   = () => process.env.NOTION_REDUCTION_PLANS_DB
const LINES_DB   = () => process.env.NOTION_REDUCTION_LINES_DB

// ── Helpers ────────────────────────────────────────────────────────
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

function mapBucket(page) {
  const p             = page.properties
  const targetAmount  = p['Target Amount']?.number  ?? 0
  const currentAmount = p['Current Amount']?.number ?? 0
  const monthlyTopUp  = p['Monthly Top Up']?.number ?? 0
  const targetDate    = p['Target Date']?.date?.start ?? null
  const amountOwed    = p['Amount Owed']?.number      ?? 0

  const percentFunded = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

  let monthsRemaining = null
  if (monthlyTopUp > 0 && currentAmount < targetAmount) {
    monthsRemaining = Math.ceil((targetAmount - currentAmount) / monthlyTopUp)
  }

  let onTrack = true
  if (targetDate && monthsRemaining !== null) {
    const now = new Date()
    const target = new Date(targetDate)
    const monthsUntilTarget =
      (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
    onTrack = monthsRemaining <= monthsUntilTarget
  }

  return {
    id:               page.id,
    name:             p.Name?.title?.[0]?.plain_text  ?? '',
    type:             p.Type?.select?.name            ?? 'Permanent',
    targetAmount,
    currentAmount,
    monthlyTopUp,
    targetDate,
    status:           p.Status?.select?.name          ?? 'Active',
    amountOwed,
    monthlyRepayment: p['Monthly Repayment']?.number  ?? 0,
    notes:            p.Notes?.rich_text?.[0]?.plain_text ?? '',
    percentFunded,
    monthsRemaining,
    onTrack,
  }
}

const STATUS_ORDER = { Active: 0, Funded: 1, Spending: 2, Repaying: 3, Completed: 4, Dissolved: 5 }

// ── GET /api/finance/buckets ────────────────────────────────────────
router.get('/buckets', async (req, res) => {
  try {
    const { showCompleted } = req.query
    const pages = await queryAll(DB())
    let buckets = pages.map(mapBucket)

    if (!showCompleted) {
      buckets = buckets.filter(b => b.status !== 'Dissolved' && b.status !== 'Completed')
    }

    buckets.sort((a, b) => {
      const sd = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
      return sd !== 0 ? sd : a.name.localeCompare(b.name)
    })

    res.json({ success: true, data: buckets })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/finance/buckets ───────────────────────────────────────
router.post('/buckets', async (req, res) => {
  try {
    const { name, type, targetAmount, monthlyTopUp, targetDate } = req.body
    const page = await notion.pages.create({
      parent: { database_id: DB() },
      properties: {
        Name:             { title: [{ text: { content: name } }] },
        Type:             { select: { name: type ?? 'Permanent' } },
        'Target Amount':  { number: parseFloat(targetAmount)  || 0 },
        'Current Amount': { number: 0 },
        'Monthly Top Up': { number: parseFloat(monthlyTopUp)  || 0 },
        Status:           { select: { name: 'Active' } },
        ...(targetDate ? { 'Target Date': { date: { start: targetDate } } } : {}),
      },
    })
    res.json({ success: true, data: mapBucket(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/finance/buckets/:id/allocate ──────────────────────────
router.post('/buckets/:id/allocate', async (req, res) => {
  try {
    const { amount } = req.body
    const page = await notion.pages.retrieve({ page_id: req.params.id })
    const current = page.properties['Current Amount']?.number ?? 0
    const target  = page.properties['Target Amount']?.number  ?? 0
    const newAmount = current + parseFloat(amount)
    const props = { 'Current Amount': { number: newAmount } }
    if (newAmount >= target && target > 0) props.Status = { select: { name: 'Funded' } }

    const updated = await notion.pages.update({ page_id: req.params.id, properties: props })
    res.json({ success: true, data: mapBucket(updated) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/finance/buckets/:id/spend ────────────────────────────
router.post('/buckets/:id/spend', async (req, res) => {
  try {
    const { amount } = req.body
    const spend = parseFloat(amount)
    const page  = await notion.pages.retrieve({ page_id: req.params.id })
    const current = page.properties['Current Amount']?.number ?? 0

    const drawn    = Math.min(current, spend)
    const shortfall = Math.max(0, spend - current)
    const newAmount = Math.max(0, current - spend)

    const props = { 'Current Amount': { number: newAmount } }
    if (newAmount === 0) props.Status = { select: { name: 'Completed' } }

    const updated = await notion.pages.update({ page_id: req.params.id, properties: props })
    res.json({ success: true, data: { bucket: mapBucket(updated), shortfall, drawn } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/finance/buckets/:id/repayment ────────────────────────
router.post('/buckets/:id/repayment', async (req, res) => {
  try {
    const { shortfall, monthlyRepayment } = req.body
    const original = await notion.pages.retrieve({ page_id: req.params.id })
    const originalName = original.properties.Name?.title?.[0]?.plain_text ?? 'Bucket'

    const page = await notion.pages.create({
      parent: { database_id: DB() },
      properties: {
        Name:               { title: [{ text: { content: `${originalName} repayment` } }] },
        Type:               { select: { name: 'Repayment' } },
        'Target Amount':    { number: parseFloat(shortfall) },
        'Current Amount':   { number: 0 },
        'Monthly Top Up':   { number: 0 },
        'Amount Owed':      { number: parseFloat(shortfall) },
        'Monthly Repayment':{ number: parseFloat(monthlyRepayment) || 0 },
        Status:             { select: { name: 'Repaying' } },
      },
    })
    res.json({ success: true, data: mapBucket(page) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/finance/buckets/:id/reduction-plan ───────────────────
router.post('/buckets/:id/reduction-plan', async (req, res) => {
  try {
    if (!PLANS_DB() || !LINES_DB()) {
      return res.status(503).json({ success: false, error: 'Reduction plan DBs not configured. Add NOTION_REDUCTION_PLANS_DB and NOTION_REDUCTION_LINES_DB to .env' })
    }

    const { shortfall, reductions } = req.body
    const totalAbsorbed = reductions.reduce((s, r) => s + r.reduceBy * r.months, 0)
    if (totalAbsorbed < shortfall) {
      return res.status(400).json({ success: false, error: `Reductions absorb $${totalAbsorbed.toFixed(2)} but shortfall is $${shortfall.toFixed(2)}` })
    }

    // Look up original budget limits
    const budgetPages = BUDGETS_DB()
      ? await queryAll(BUDGETS_DB(), { property: 'Active', checkbox: { equals: true } })
      : []
    const budgetMap = {}
    for (const pg of budgetPages) {
      const p   = pg.properties
      const cat = Object.values(p).find(v => v.type === 'title')?.title?.[0]?.plain_text ?? ''
      if (cat) budgetMap[cat.toLowerCase()] = p['Monthly Limit']?.number ?? 0
    }

    // Calculate plan date range
    const now        = new Date()
    const maxMonths  = Math.max(...reductions.map(r => r.months))
    const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const endDate    = new Date(now.getFullYear(), now.getMonth() + maxMonths - 1, 1)
    const endMonth   = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`

    const original = await notion.pages.retrieve({ page_id: req.params.id })
    const bucketName = original.properties.Name?.title?.[0]?.plain_text ?? 'Bucket'

    // Create plan
    const plan = await notion.pages.create({
      parent: { database_id: PLANS_DB() },
      properties: {
        Name:          { title: [{ text: { content: `${bucketName} shortfall plan` } }] },
        'Linked Bucket': { relation: [{ id: req.params.id }] },
        Shortfall:     { number: parseFloat(shortfall) },
        'Start Month': { date: { start: `${startMonth}-01` } },
        'End Month':   { date: { start: `${endMonth}-01` } },
        Status:        { select: { name: 'Active' } },
      },
    })

    // Create lines
    const lines = []
    for (const r of reductions) {
      const origLimit    = budgetMap[r.category.toLowerCase()] ?? 0
      const reducedLimit = Math.max(0, origLimit - r.reduceBy)
      const line = await notion.pages.create({
        parent: { database_id: LINES_DB() },
        properties: {
          Plan:             { relation: [{ id: plan.id }] },
          Category:         { select: { name: r.category } },
          'Original Limit': { number: origLimit },
          'Reduced Limit':  { number: reducedLimit },
          Months:           { number: r.months },
        },
      })
      lines.push({ category: r.category, origLimit, reducedLimit, months: r.months, id: line.id })
    }

    res.json({ success: true, data: { planId: plan.id, startMonth, endMonth, lines } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/finance/buckets/:id/allocate-monthly ─────────────────
router.post('/buckets/:id/allocate-monthly', async (req, res) => {
  try {
    const page     = await notion.pages.retrieve({ page_id: req.params.id })
    const current  = page.properties['Current Amount']?.number  ?? 0
    const owed     = page.properties['Amount Owed']?.number     ?? 0
    const monthly  = page.properties['Monthly Repayment']?.number ?? 0
    const newAmount = current + monthly
    const props = { 'Current Amount': { number: newAmount } }
    if (newAmount >= owed && owed > 0) props.Status = { select: { name: 'Completed' } }
    const updated = await notion.pages.update({ page_id: req.params.id, properties: props })
    res.json({ success: true, data: mapBucket(updated) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PATCH /api/finance/buckets/:id ─────────────────────────────────
router.patch('/buckets/:id', async (req, res) => {
  try {
    const { name, targetAmount, monthlyTopUp, targetDate, status } = req.body
    const props = {}
    if (name        != null) props.Name             = { title: [{ text: { content: name } }] }
    if (targetAmount!= null) props['Target Amount'] = { number: parseFloat(targetAmount) || 0 }
    if (monthlyTopUp!= null) props['Monthly Top Up']= { number: parseFloat(monthlyTopUp) || 0 }
    if (status      != null) props.Status           = { select: { name: status } }
    if (targetDate  != null) props['Target Date']   = targetDate
      ? { date: { start: targetDate } }
      : { date: null }
    const updated = await notion.pages.update({ page_id: req.params.id, properties: props })
    res.json({ success: true, data: mapBucket(updated) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/finance/buckets/:id (soft) ─────────────────────────
router.delete('/buckets/:id', async (req, res) => {
  try {
    const updated = await notion.pages.update({
      page_id: req.params.id,
      properties: { Status: { select: { name: 'Dissolved' } } },
    })
    res.json({ success: true, data: mapBucket(updated) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
