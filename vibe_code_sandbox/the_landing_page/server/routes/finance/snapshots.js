import { Router } from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const router = Router()
const __dir   = dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = join(__dir, '../../data')
const DATA_FILE = join(DATA_DIR, 'snapshots.json')

function readSnapshots() {
  if (!existsSync(DATA_FILE)) return []
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf8')) } catch { return [] }
}

function writeSnapshots(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// GET /api/finance/snapshots
router.get('/snapshots', (req, res) => {
  res.json({ success: true, data: readSnapshots() })
})

// POST /api/finance/snapshots — upsert snapshot for a month
// Body: { month: 'YYYY-MM', cash, savings, cpf, netWorth }
router.post('/snapshots', (req, res) => {
  const { month, cash, savings, cpf, netWorth } = req.body
  if (!month) return res.status(400).json({ success: false, error: 'month required' })
  const all = readSnapshots()
  const idx = all.findIndex(s => s.month === month)
  const entry = { month, cash, savings, cpf, netWorth }
  if (idx >= 0) all[idx] = entry
  else all.push(entry)
  writeSnapshots(all)
  res.json({ success: true, data: entry })
})

export default router
