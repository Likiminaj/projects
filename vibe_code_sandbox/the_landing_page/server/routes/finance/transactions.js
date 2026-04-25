import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const DB_ID         = () => process.env.NOTION_TRANSACTIONS_DB
const CATEGORIES_DB = () => process.env.NOTION_CATEGORIES_DB

// ── Schema cache ──────────────────────────────────────────────────
let _schema      = null
let _schemaTypes = null

async function getSchema() {
  if (_schema) return _schema
  const db     = await notion.databases.retrieve({ database_id: DB_ID() })
  _schema      = new Set(Object.keys(db.properties))
  _schemaTypes = Object.fromEntries(Object.entries(db.properties).map(([k, v]) => [k, v.type]))
  return _schema
}

export async function buildCategoryProperty(category) {
  if (!category) return {}
  if (!_schemaTypes) await getSchema()
  if (_schemaTypes?.Category === 'relation' && CATEGORIES_DB()) {
    const cats = await notion.databases.query({
      database_id: CATEGORIES_DB(),
      filter: { property: 'Name', title: { equals: category } },
      page_size: 1,
    })
    if (cats.results.length > 0) {
      return { Category: { relation: [{ id: cats.results[0].id }] } }
    }
    // Exact match failed — scan all categories for case-insensitive match
    const allCats = await notion.databases.query({ database_id: CATEGORIES_DB(), page_size: 100 })
    const needle  = category.trim().toLowerCase()
    const match   = allCats.results.find(p =>
      (p.properties.Name?.title?.[0]?.plain_text ?? '').trim().toLowerCase() === needle
    )
    if (match) return { Category: { relation: [{ id: match.id }] } }
    return {}
  }
  return { Category: { select: { name: category } } }
}

// ── Category resolution ───────────────────────────────────────────
// Handles Select (legacy), Relation (relational setup), Rollup, Formula
export function resolveCat(prop, catMap = new Map()) {
  if (!prop) return null
  switch (prop.type) {
    case 'title':    return prop.title?.[0]?.plain_text    ?? null
    case 'select':   return prop.select?.name              ?? null
    case 'relation': return catMap.get(prop.relation?.[0]?.id) ?? null
    case 'rollup': {
      const first = prop.rollup?.array?.[0]
      if (!first) return null
      if (first.type === 'title')     return first.title?.[0]?.plain_text     ?? null
      if (first.type === 'rich_text') return first.rich_text?.[0]?.plain_text ?? null
      if (first.type === 'select')    return first.select?.name               ?? null
      return null
    }
    case 'formula':   return prop.formula?.string          ?? null
    case 'rich_text': return prop.rich_text?.[0]?.plain_text ?? null
    default:          return null
  }
}

// ── Fetch all active categories → Map<pageId, name> ──────────────
export async function buildCatMap() {
  try {
    // Use env var if set, otherwise auto-discover from the Category relation on the transactions DB
    let dbId = CATEGORIES_DB()
    if (!dbId) {
      const db = await notion.databases.retrieve({ database_id: DB_ID() })
      dbId = db.properties.Category?.relation?.database_id
    }
    if (!dbId) return new Map()

    // Paginate to handle any number of category pages
    const results = []
    let cursor
    do {
      const res = await notion.databases.query({
        database_id: dbId, page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      })
      results.push(...res.results)
      cursor = res.has_more ? res.next_cursor : undefined
    } while (cursor)

    return new Map(results.map(pg => [
      pg.id,
      Object.values(pg.properties).find(v => v.type === 'title')?.title?.[0]?.plain_text ?? '',
    ]))
  } catch {
    return new Map()
  }
}

// ── Mapper ────────────────────────────────────────────────────────
function mapTransaction(page, catMap = new Map()) {
  const p = page.properties
  return {
    id:          page.id,
    title:       (p.Title ?? p.Name)?.title[0]?.plain_text ?? '',
    merchant:    p.Merchant?.rich_text[0]?.plain_text ?? '',
    date:        p.Date?.date?.start ?? null,
    amount:      p.Amount?.number ?? 0,
    direction:   p.Direction?.select?.name ?? null,
    category:    resolveCat(p.Category, catMap),
    source:      p.Source?.select?.name ?? null,
    isPendingMatcha: p['Is Pending Matcha']?.checkbox ?? false,
    isBucketSpend:   p['Is Bucket Spend']?.checkbox ?? false,
    notes:       p.Notes?.rich_text[0]?.plain_text ?? '',
    needsReview: p['Needs Review']?.checkbox ?? false,
  }
}

// GET /api/finance/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { month, category, source, needsReview } = req.query
    const filters = []

    if (month) {
      const [year, mon] = month.split('-').map(Number)
      const firstDay = `${year}-${String(mon).padStart(2, '0')}-01`
      const lastDay  = new Date(year, mon, 0).toISOString().split('T')[0]
      filters.push({ property: 'Date', date: { on_or_after:  firstDay } })
      filters.push({ property: 'Date', date: { on_or_before: lastDay  } })
    }
    if (category) {
      // Detect Category property type — relation needs a different filter than select
      const schema = await getSchema()
      if (_schemaTypes?.Category === 'relation' && CATEGORIES_DB()) {
        const catPages = await notion.databases.query({
          database_id: CATEGORIES_DB(),
          filter: { property: 'Name', title: { equals: category } },
          page_size: 1,
        })
        if (catPages.results.length > 0) {
          filters.push({ property: 'Category', relation: { contains: catPages.results[0].id } })
        }
        // If category page not found, skip the filter — returns all transactions (better than empty)
      } else {
        filters.push({ property: 'Category', select: { equals: category } })
      }
    }
    if (source)              filters.push({ property: 'Source',        select:   { equals: source  } })
    if (needsReview === 'true') filters.push({ property: 'Needs Review', checkbox: { equals: true  } })

    const queryParams = {
      database_id: DB_ID(),
      sorts: [{ property: 'Date', direction: 'descending' }],
      ...(filters.length === 1 ? { filter: filters[0] }
        : filters.length  >  1 ? { filter: { and: filters } }
        : {}),
    }

    const pages = []
    let cursor
    do {
      const res = await notion.databases.query({ ...queryParams, start_cursor: cursor })
      pages.push(...res.results)
      cursor = res.has_more ? res.next_cursor : undefined
    } while (cursor)

    const catMap = await buildCatMap()
    res.json({ success: true, data: pages.map(pg => mapTransaction(pg, catMap)) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/finance/transactions
router.post('/transactions', async (req, res) => {
  try {
    const { title, merchant, date, amount, direction, category, source, notes, isPendingMatcha } = req.body
    const schema = await getSchema()

    const titleProp = schema.has('Title') ? 'Title' : 'Name'

    const properties = {
      [titleProp]: { title: [{ text: { content: title ?? '' } }] },
      Date:        { date: { start: date } },
      Amount:      { number: amount },
      ...(direction ? { Direction: { select: { name: direction } } } : {}),
      ...(source    ? { Source:    { select: { name: source    } } } : {}),
      Notes:           { rich_text: notes ? [{ text: { content: notes } }] : [] },
      'Is Pending Matcha': { checkbox: isPendingMatcha ?? false },
      'Is Bucket Spend':   { checkbox: false },
    }

    if (schema.has('Auto Parsed'))  properties['Auto Parsed']  = { checkbox: false }
    if (schema.has('Needs Review')) properties['Needs Review'] = { checkbox: !category }

    if (schema.has('Merchant') && merchant) {
      properties.Merchant = { rich_text: [{ text: { content: merchant } }] }
    }

    // Set category — handle both Select and Relation property types
    if (category) {
      Object.assign(properties, await buildCategoryProperty(category))
    }

    const catMap = await buildCatMap()
    const page = await notion.pages.create({ parent: { database_id: DB_ID() }, properties })
    res.json({ success: true, data: mapTransaction(page, catMap) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/finance/transactions/:id
router.delete('/transactions/:id', async (req, res) => {
  try {
    await notion.pages.update({ page_id: req.params.id, archived: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
