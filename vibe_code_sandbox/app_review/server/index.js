import express from 'express'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const gplayModule = require('google-play-scraper')
const gplay = gplayModule.default ?? gplayModule
const appstore = require('app-store-scraper')
const vader = require('vader-sentiment')

const app = express()
const port = Number.parseInt(process.env.PORT ?? '8787', 10)

// ─── Date helpers ────────────────────────────────────────────────
function toDateOnly(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function isWithinRange(dateValue, startDate, endDate) {
  if (!dateValue || !startDate || !endDate) return true
  const target = new Date(`${dateValue}T00:00:00Z`)
  const start  = new Date(`${startDate}T00:00:00Z`)
  const end    = new Date(`${endDate}T23:59:59Z`)
  return target >= start && target <= end
}

// ─── Search mappers ──────────────────────────────────────────────
function mapAppleSearchResult(result) {
  return {
    name: result.title,
    app_id: String(result.id),
    platform: 'ios',
    publisher: result.developer ?? '',
    category: result.genre ?? result.primaryGenre ?? 'App',
    description: result.description ?? '',
    icon: result.icon ?? '',
    url: result.url ?? '',
    store: 'App Store',
    aliases: [result.title, result.developer, result.genre, 'App Store'].filter(Boolean),
  }
}

function mapGoogleSearchResult(result) {
  return {
    name: result.title,
    app_id: String(result.appId),
    platform: 'android',
    publisher: result.developer ?? '',
    category: result.genre ?? 'App',
    description: result.summary ?? '',
    icon: result.icon ?? '',
    url: result.url ?? '',
    store: 'Google Play',
    aliases: [result.title, result.developer, result.genre, 'Google Play'].filter(Boolean),
  }
}

// ─── Review normalizers ──────────────────────────────────────────
function normalizeGoogleReview(review, appName) {
  return {
    review_text: review.text != null ? String(review.text) : '',
    rating: review.score ?? 0,
    date: toDateOnly(review.date),
    platform: 'android',
    app_name: appName,
    version: review.version ?? null,
    review_id: review.id ?? null,
    author: review.userName ?? null,
  }
}

// ─── Sentiment + derived fields ──────────────────────────────────
function scoreSentiment(text) {
  try {
    if (!text || !text.trim()) return { sentiment_score: 0, sentiment_label: 'neutral' }
    const { compound } = vader.SentimentIntensityAnalyzer.polarity_scores(text)
    const score = Math.round(compound * 1000) / 1000
    return {
      sentiment_score: score,
      sentiment_label: score >= 0.05 ? 'positive' : score <= -0.05 ? 'negative' : 'neutral',
    }
  } catch {
    return { sentiment_score: 0, sentiment_label: 'neutral' }
  }
}

function enrichReview(review) {
  const date = review.date ?? ''
  return {
    ...review,
    source: review.platform === 'ios' ? 'App Store' : 'Google Play',
    review_month: date.length >= 7 ? date.slice(0, 7) : null,
    review_length: review.review_text.length,
    has_text: review.review_text.length > 0,
    ...scoreSentiment(review.review_text),
  }
}

// Stateful dedup — pass same `seen` Set across streaming batches
function prepareIncremental(reviews, seen) {
  return reviews
    .map(r => ({ ...r, review_text: r.review_text.replace(/[\r\n\t]+/g, ' ').trim() }))
    .filter(r => {
      if (!r.review_text) return false
      const key = `${r.platform}|${r.author ?? ''}|${r.review_text.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function aggregateByMonth(reviews) {
  const buckets = {}
  for (const r of reviews) {
    if (!r.review_month) continue
    const b = (buckets[r.review_month] ??= {
      period: r.review_month,
      review_count: 0, rating_sum: 0, sentiment_sum: 0,
      positive_count: 0, neutral_count: 0, negative_count: 0,
    })
    b.review_count++
    b.rating_sum += r.rating ?? 0
    b.sentiment_sum += r.sentiment_score ?? 0
    b[`${r.sentiment_label}_count`]++
  }
  return Object.values(buckets)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map(b => ({
      period: b.period,
      review_count: b.review_count,
      avg_rating: Math.round((b.rating_sum / b.review_count) * 10) / 10,
      avg_sentiment: Math.round((b.sentiment_sum / b.review_count) * 1000) / 1000,
      positive_count: b.positive_count,
      neutral_count: b.neutral_count,
      negative_count: b.negative_count,
    }))
}

// ─── SSE helpers ─────────────────────────────────────────────────
function openSSE(res) {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no',
  })
}

function sseSend(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}


// ─── Search ──────────────────────────────────────────────────────
async function searchApple(term) {
  const results = await appstore.search({ term, num: 10, page: 1, country: 'us', lang: 'en-us' })
  return results.map(mapAppleSearchResult)
}

async function searchGoogle(term) {
  const results = await gplay.search({ term, num: 10, lang: 'en', country: 'us' })
  return results.map(mapGoogleSearchResult)
}

// ─── Streaming fetchers ───────────────────────────────────────────

// Apple: uses app-store-scraper (iTunes RSS/API) — no website token scraping.
// Iterates RECENT + HELPFUL sort orders, up to 10 pages × 50 reviews each.
async function streamAppleReviews({ res, appId, startDate, endDate, appName, seen, signal }) {
  const numericId = Number.parseInt(appId, 10)
  if (Number.isNaN(numericId)) throw new Error('Apple app IDs must be numeric')

  const sorts = [appstore.sort.RECENT, appstore.sort.HELPFUL]

  for (const sort of sorts) {
    for (let page = 1; page <= 10; page++) {
      if (signal.aborted) return

      let entries
      try {
        entries = await appstore.reviews({ id: numericId, sort, page, country: 'us' })
      } catch { break }

      if (!Array.isArray(entries) || entries.length === 0) break

      const raw = entries.map(e => ({
        review_text: e.text != null ? String(e.text) : '',
        rating:      e.score ?? 0,
        date:        toDateOnly(e.updated),
        platform:    'ios',
        app_name:    appName,
        version:     e.version ?? null,
        review_id:   e.id != null ? String(e.id) : null,
        author:      e.userName ?? null,
      }))

      const inRange = raw.filter(r => isWithinRange(r.date, startDate, endDate))
      const cleaned = prepareIncremental(inRange, seen).map(enrichReview)
      if (cleaned.length > 0) sseSend(res, 'batch', { reviews: cleaned })

      if (entries.length < 50) break
    }
    if (signal.aborted) return
  }
}

// Google Play: paginate NEWEST + RATING sort orders until tokens run out, capped at 30 pages each
async function streamGoogleReviews({ res, appId, startDate, endDate, appName, seen, signal }) {
  const sorts = [gplay.sort.NEWEST, gplay.sort.RATING]

  for (const sort of sorts) {
    if (signal.aborted) return
    let token     = undefined
    let pageCount = 0
    const MAX_PAGES = 30

    do {
      if (signal.aborted) return

      let result
      try {
        result = await gplay.reviews({
          appId, sort, num: 200, lang: 'en', country: 'us',
          ...(token ? { nextPaginationToken: token } : {}),
        })
      } catch { break }

      const batch = Array.isArray(result?.data) ? result.data : []
      token = result?.nextPaginationToken ?? null
      pageCount++

      const inRange = batch
        .map(r => normalizeGoogleReview(r, appName))
        .filter(r => isWithinRange(r.date, startDate, endDate))
      const cleaned = prepareIncremental(inRange, seen).map(enrichReview)
      if (cleaned.length > 0) sseSend(res, 'batch', { reviews: cleaned })

      if (batch.length < 200) break
    } while (token && pageCount < MAX_PAGES)
  }
}

// ─── Express routes ──────────────────────────────────────────────
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/search', async (req, res) => {
  const term = String(req.query.q ?? '').trim()
  if (!term) {
    res.status(400).json({ error: 'Missing search query' })
    return
  }

  const [apple, google] = await Promise.allSettled([searchApple(term), searchGoogle(term)])
  const candidates = []
  const errors = []

  if (apple.status === 'fulfilled') candidates.push(...apple.value)
  else errors.push({ source: 'app_store', message: apple.reason?.message ?? 'App Store search failed' })

  if (google.status === 'fulfilled') candidates.push(...google.value)
  else errors.push({ source: 'google_play', message: google.reason?.message ?? 'Google Play search failed' })

  res.json({ query: term, candidates, errors })
})

// SSE streaming endpoint — sends batches as they arrive
app.get('/api/reviews/stream', async (req, res) => {
  const platform  = String(req.query.platform   ?? '').trim().toLowerCase()
  const appId     = String(req.query.app_id     ?? '').trim()
  const appName   = String(req.query.app_name   ?? '').trim() || 'Selected app'
  const startDate = String(req.query.start_date ?? '').trim()
  const endDate   = String(req.query.end_date   ?? '').trim()

  if (!platform || !appId) {
    res.status(400).json({ error: 'platform and app_id are required' })
    return
  }

  openSSE(res)

  const ac = new AbortController()
  req.on('close', () => ac.abort())

  const seen = new Set()
  const ctx  = { res, appId, startDate, endDate, appName, seen, signal: ac.signal }

  try {
    if (platform === 'ios') {
      await streamAppleReviews(ctx)
    } else if (platform === 'android') {
      await streamGoogleReviews(ctx)
    } else {
      sseSend(res, 'error', { message: 'platform must be ios or android' })
      res.end()
      return
    }
  } catch (err) {
    sseSend(res, 'error', { message: err.message ?? 'Stream failed' })
  }

  sseSend(res, 'done', { total: seen.size })
  res.end()
})

app.listen(port, () => {
  console.log(`Review API listening on http://localhost:${port}`)
})
