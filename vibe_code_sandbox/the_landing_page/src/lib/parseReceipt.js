import Tesseract from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

export async function extractTextFromImage(file) {
  const { data: { text } } = await Tesseract.recognize(file, 'eng')
  return text
}

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map(item => item.str).join(' '))
  }
  return pages.join('\n')
}

// ── Date parsing ─────────────────────────────────────────────────
const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

function parseDate(line) {
  let m
  m = line.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  m = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) {
    const yr = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }

  m = line.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s]*(\d{4})?/i)
  if (m) {
    const yr = m[3] ?? new Date().getFullYear()
    return `${yr}-${MONTH_MAP[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`
  }

  return null
}

// ── Transaction parser ───────────────────────────────────────────
const INCOME_RE = /salary|credited|credit|received|incoming|transfer in|refund|payroll|dividend|payout/i
const SKIP_RE   = /^(?:balance|total|subtotal|running|available|closing|opening|beginning|date\b|description\b|amount\b|transaction\b)/i

export function parseTransactions(rawText) {
  const today = new Date().toISOString().split('T')[0]
  const results = []

  for (const raw of rawText.split('\n')) {
    const line = raw.trim()
    if (!line || line.length < 4) continue
    if (SKIP_RE.test(line)) continue

    // Line must contain a decimal amount to be considered a transaction
    const amountMatch = line.match(/(?:S?\$|SGD\s*)?([\d,]+\.\d{2})\b/i)
    if (!amountMatch) continue

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''))
    if (amount <= 0 || amount > 999999) continue

    const date = parseDate(line) ?? today

    const merchant = line
      .replace(/(?:S?\$|SGD\s*)[\d,]+\.?\d*/gi, '')
      .replace(/\d{4}-\d{2}-\d{2}/g, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '')
      .replace(/\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s]*\d{0,4}/gi, '')
      .replace(/[^\w\s&'.()\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Unknown'

    const direction = INCOME_RE.test(line) ? 'Income' : 'Expense'
    results.push({ merchant, amount, date, direction, category: '' })
  }

  return results
}
