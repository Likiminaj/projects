import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()

const CATEGORIES_DB   = () => process.env.NOTION_CATEGORIES_DB
const TRANSACTIONS_DB = () => process.env.NOTION_TRANSACTIONS_DB
const RECURRING_DB    = () => process.env.NOTION_RECURRING_DB
const UPCOMING_DB     = () => process.env.NOTION_UPCOMING_DB

// ── Mappers ──────────────────────────────────────────────────────────────────
const mapCat = page => ({
  name:  page.properties.Name?.title[0]?.plain_text ?? '',
  color: page.properties.Color?.select?.name        ?? 'default',
})

// ── Select-option helpers (sources only) ─────────────────────────────────────
const COLORS = ['gray','brown','orange','yellow','green','blue','purple','pink','red','default']
const pickColor = i => COLORS[i % COLORS.length]

async function getSourceOptions() {
  const db = await notion.databases.retrieve({ database_id: TRANSACTIONS_DB() })
  return db.properties.Source?.select?.options ?? []
}

async function setSourceOptions(options) {
  await notion.databases.update({
    database_id: TRANSACTIONS_DB(),
    properties: { Source: { select: { options } } },
  })
}

async function getCategorySelectOptions(dbId) {
  if (!dbId) return []
  const db = await notion.databases.retrieve({ database_id: dbId })
  return db.properties.Category?.select?.options ?? []
}

function mergeCategories(primary, fallbackOptions) {
  const merged = new Map()
  for (const c of primary) merged.set(c.name.toLowerCase(), c)
  for (const opt of fallbackOptions) {
    const key = opt.name.toLowerCase()
    if (!merged.has(key)) merged.set(key, { name: opt.name, color: opt.color ?? 'default' })
  }
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name))
}

// ── GET /api/finance/categories ──────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const txDb    = await notion.databases.retrieve({ database_id: TRANSACTIONS_DB() })
    const sources = (txDb.properties.Source?.select?.options ?? []).map(o => ({ name: o.name, color: o.color }))
    const selectFallback = [
      ...(await getCategorySelectOptions(TRANSACTIONS_DB())),
      ...(await getCategorySelectOptions(RECURRING_DB())),
      ...(await getCategorySelectOptions(UPCOMING_DB())),
    ].map(o => ({ name: o.name, color: o.color }))

    // Resolve categories DB: env var → auto-discover from relation → select options fallback
    let catDbId = CATEGORIES_DB()
    if (!catDbId) {
      catDbId = txDb.properties.Category?.relation?.database_id ?? null
    }

    if (catDbId) {
      const allCatPages = []
      let cursor
      do {
        const res = await notion.databases.query({
          database_id: catDbId,
          sorts: [{ property: 'Name', direction: 'ascending' }],
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        })
        allCatPages.push(...res.results)
        cursor = res.has_more ? res.next_cursor : undefined
      } while (cursor)
      const categories = mergeCategories(allCatPages.map(mapCat), selectFallback)
      return res.json({ success: true, data: { categories, sources } })
    }

    // Last resort: read select options directly from the Category field
    const pick = prop => (txDb.properties[prop]?.select?.options ?? []).map(o => ({ name: o.name, color: o.color }))
    res.json({ success: true, data: { categories: mergeCategories(pick('Category'), selectFallback), sources } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/finance/categories ─────────────────────────────────────────────
// Body: { type: 'source', name }  — categories are managed in Notion directly
router.post('/categories', async (req, res) => {
  try {
    const { type, name } = req.body
    if (type !== 'source') return res.status(400).json({ success: false, error: 'categories are managed in Notion directly' })
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'name is required' })
    const trimmed = name.trim()

    const existing = await getSourceOptions()
    if (existing.find(o => o.name.toLowerCase() === trimmed.toLowerCase())) {
      return res.json({ success: true, data: { name: trimmed, color: 'default', already_exists: true } })
    }
    const newOpt = { name: trimmed, color: pickColor(existing.length) }
    await setSourceOptions([...existing.map(o => ({ name: o.name, color: o.color })), newOpt])
    res.json({ success: true, data: newOpt })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/finance/categories ───────────────────────────────────────────
// Body: { type: 'source', name }  — categories are managed in Notion directly
router.delete('/categories', async (req, res) => {
  try {
    const { type, name } = req.body
    if (type !== 'source') return res.status(400).json({ success: false, error: 'categories are managed in Notion directly' })
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'name is required' })
    const trimmed = name.trim()

    const existing = await getSourceOptions()
    await setSourceOptions(existing.filter(o => o.name.toLowerCase() !== trimmed.toLowerCase()).map(o => ({ name: o.name, color: o.color })))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
