import { useEffect, useMemo, useRef, useState } from 'react'
import { rankApps } from './lib/fuzzy.js'
import { getDefaultDateRange } from './lib/time.js'
import { Button, Badge, Card, CardHeader, Field, Input, EmptyState, Note, Spinner, Divider } from './components/ui.jsx'
import { SentimentTrendChart } from './components/SentimentChart.jsx'

const QUICK_STARTS = ['Zig', 'Grab', 'Uber', 'Bolt', 'Gojek', 'Lyft']

const PLATFORM_COLORS = { ios: 'blue', android: 'green' }
const PLATFORM_LABELS = { ios: 'App Store', android: 'Google Play' }

// ─── Helpers ──────────────────────────────────────────────────────

async function safeJson(res, fallback) {
  const text = await res.text()
  if (!text) throw new Error(fallback + ' (server returned empty response — is it running?)')
  try { return JSON.parse(text) } catch { throw new Error(fallback + ': ' + text.slice(0, 120)) }
}

function aggregateClientSide(reviews) {
  const b = {}
  for (const r of reviews) {
    if (!r.review_month) continue
    const e = (b[r.review_month] ??= {
      period: r.review_month, review_count: 0, rating_sum: 0, sentiment_sum: 0,
      positive_count: 0, neutral_count: 0, negative_count: 0,
    })
    e.review_count++
    e.rating_sum += r.rating ?? 0
    e.sentiment_sum += r.sentiment_score ?? 0
    e[`${r.sentiment_label}_count`]++
  }
  return Object.values(b)
    .sort((a, c) => a.period.localeCompare(c.period))
    .map(e => ({
      period: e.period,
      review_count: e.review_count,
      avg_rating: Math.round(e.rating_sum / e.review_count * 10) / 10,
      avg_sentiment: Math.round(e.sentiment_sum / e.review_count * 1000) / 1000,
      positive_count: e.positive_count,
      neutral_count: e.neutral_count,
      negative_count: e.negative_count,
    }))
}

// ─── Shared primitives ────────────────────────────────────────────

function AppIcon({ src, name, size = 44, className = 'app-icon', fallbackClass = 'app-icon--fallback' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className={fallbackClass} style={{ width: size, height: size }}>{name?.[0] ?? '?'}</div>
  }
  return <img className={className} src={src} alt={name} width={size} height={size} onError={() => setFailed(true)} />
}

// ─── Sidebar: search + selection ─────────────────────────────────

function SearchDropdown({ candidates, loading, query, setQuery, onSearch, onSelect, selectedApps }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const ranked = useMemo(() => rankApps(query, candidates), [query, candidates])

  useEffect(() => {
    function onDown(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function submit(e) {
    e.preventDefault()
    const t = query.trim()
    if (t) { onSearch(t); setOpen(true) }
  }

  function quickSearch(val) {
    setQuery(val)
    onSearch(val)
    setOpen(true)
  }

  function select(app) {
    onSelect(app)
    setOpen(false)
  }

  const isAdded = app => selectedApps.some(a => a.app_id === app.app_id && a.platform === app.platform)

  return (
    <div ref={ref} className="search-container">
      <form onSubmit={submit}>
        <Field label="Search apps">
          <div className="search-input-row">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => ranked.length && setOpen(true)}
              placeholder="Company or app name…"
            />
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? '…' : 'Search'}
            </Button>
          </div>
        </Field>
      </form>

      <div className="chip-row" style={{ marginTop: 10 }}>
        {QUICK_STARTS.map(s => (
          <Button key={s} type="button" variant="chip" size="sm" onClick={() => quickSearch(s)}>{s}</Button>
        ))}
      </div>

      {open && ranked.length > 0 && (
        <div className="search-dropdown">
          {ranked.map(app => (
            <button
              key={`${app.platform}-${app.app_id}`}
              type="button"
              className={['dropdown-item', isAdded(app) ? 'dropdown-item--added' : ''].filter(Boolean).join(' ')}
              onClick={() => select(app)}
            >
              <AppIcon src={app.icon} name={app.name} size={36} />
              <div className="dropdown-item__body">
                <div className="dropdown-item__name">{app.name}</div>
                <div className="dropdown-item__publisher">{app.publisher}</div>
              </div>
              <Badge variant={PLATFORM_COLORS[app.platform]}>
                {PLATFORM_LABELS[app.platform]}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SelectedApps({ apps, onRemove }) {
  if (!apps.length) return null
  return (
    <div className="selected-apps">
      <p className="selected-apps__label">Selected for analysis</p>
      <div className="selected-chips">
        {apps.map(app => (
          <div key={`${app.platform}-${app.app_id}`} className="selected-chip">
            <AppIcon src={app.icon} name={app.name} size={30} />
            <div className="selected-chip__info">
              <span className="selected-chip__name">{app.name}</span>
              <Badge variant={PLATFORM_COLORS[app.platform]}>{PLATFORM_LABELS[app.platform]}</Badge>
            </div>
            <button className="selected-chip__remove" onClick={() => onRemove(app)} aria-label="Remove">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Analysis panel ───────────────────────────────────────────────

function AnalysisStats({ data }) {
  const { reviews } = data
  const total   = reviews.length
  const avg     = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '—'
  const pos     = reviews.filter(r => r.sentiment_label === 'positive').length
  const neg     = reviews.filter(r => r.sentiment_label === 'negative').length
  const ios     = reviews.filter(r => r.platform === 'ios').length
  const android = reviews.filter(r => r.platform === 'android').length

  const stats = [
    { value: total, label: 'Reviews' },
    { value: avg, label: 'Avg rating' },
    { value: `${Math.round(pos / total * 100)}%`, label: 'Positive' },
    { value: `${Math.round(neg / total * 100)}%`, label: 'Negative' },
    ...(ios && android ? [
      { value: ios, label: 'App Store' },
      { value: android, label: 'Google Play' },
    ] : []),
  ]

  return (
    <div className="stats-grid" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
      {stats.map(s => (
        <div key={s.label} className="stat-item">
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function SentimentDistribution({ reviews }) {
  const total = reviews.length
  if (!total) return null
  const pos = reviews.filter(r => r.sentiment_label === 'positive').length
  const neu = reviews.filter(r => r.sentiment_label === 'neutral').length
  const neg = reviews.filter(r => r.sentiment_label === 'negative').length
  const pct = n => Math.round(n / total * 100)

  return (
    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      <div className="stat-item stat-item--positive">
        <div className="stat-value" style={{ color: 'var(--green)' }}>{pos}</div>
        <div className="stat-label">Positive · {pct(pos)}%</div>
      </div>
      <div className="stat-item">
        <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{neu}</div>
        <div className="stat-label">Neutral · {pct(neu)}%</div>
      </div>
      <div className="stat-item stat-item--negative">
        <div className="stat-value" style={{ color: 'var(--red)' }}>{neg}</div>
        <div className="stat-label">Negative · {pct(neg)}%</div>
      </div>
    </div>
  )
}

function ReviewTable({ reviews }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Review</th>
            <th>Rating</th>
            <th>Sentiment</th>
            <th>Date</th>
            <th>Platform</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r, idx) => {
            const sv = r.sentiment_label === 'positive' ? 'green' : r.sentiment_label === 'negative' ? 'red' : 'default'
            const sign = r.sentiment_score > 0 ? '+' : ''
            return (
              <tr key={`${r.platform ?? ''}-${r.review_id ?? idx}-${r.date ?? ''}`}>
                <td>{r.review_text}</td>
                <td>{r.rating} / 5</td>
                <td>
                  <div className="sentiment-cell">
                    <Badge variant={sv}>{r.sentiment_label ?? '—'}</Badge>
                    {r.sentiment_score != null && (
                      <span className={`sentiment-score sentiment-${r.sentiment_label ?? 'neutral'}`}>
                        {sign}{r.sentiment_score}
                      </span>
                    )}
                  </div>
                </td>
                <td>{r.date ?? '—'}</td>
                <td><Badge variant={PLATFORM_COLORS[r.platform]}>{PLATFORM_LABELS[r.platform]}</Badge></td>
                <td>{r.version ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AggregationTable({ data }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Reviews</th>
            <th>Avg Rating</th>
            <th>Avg Sentiment</th>
            <th>Positive</th>
            <th>Neutral</th>
            <th>Negative</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => {
            const sc = row.avg_sentiment >= 0.05 ? 'positive' : row.avg_sentiment <= -0.05 ? 'negative' : 'neutral'
            return (
              <tr key={row.period}>
                <td>{row.period}</td>
                <td>{row.review_count}</td>
                <td>{row.avg_rating}</td>
                <td className={`sentiment-${sc}`}>{row.avg_sentiment > 0 ? '+' : ''}{row.avg_sentiment}</td>
                <td style={{ color: 'var(--green)' }}>{row.positive_count}</td>
                <td style={{ color: 'var(--text-muted)' }}>{row.neutral_count}</td>
                <td style={{ color: 'var(--red)' }}>{row.negative_count}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main app ─────────────────────────────────────────────────────

export default function App() {
  const [query, setQuery]             = useState('')
  const [candidates, setCandidates]   = useState([])
  const [searchState, setSearchState] = useState({ loading: false, error: '' })
  const [selectedApps, setSelectedApps] = useState([])
  const [dateRange, setDateRange]     = useState(() => getDefaultDateRange())
  const [analysisState, setAnalysisState] = useState({ loading: false, error: '', progress: {} })
  const [analysisData, setAnalysisData]   = useState(null)
  const streamsRef = useRef([])

  function closeStreams() {
    streamsRef.current.forEach(es => es.close())
    streamsRef.current = []
  }

  useEffect(() => () => closeStreams(), [])

  async function runSearch(term) {
    const t = term.trim()
    if (!t) return
    setSearchState({ loading: true, error: '' })
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(t)}`)
      const data = await safeJson(res, 'Search failed')
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setCandidates(Array.isArray(data.candidates) ? data.candidates : [])
      setSearchState({ loading: false, error: '' })
    } catch (err) {
      setCandidates([])
      setSearchState({ loading: false, error: err.message || 'Search failed' })
    }
  }

  function handleSelect(app) {
    setSelectedApps(prev => {
      const rest = prev.filter(a => a.platform !== app.platform)
      return [...rest, app]
    })
  }

  function handleRemove(app) {
    setSelectedApps(prev => prev.filter(a => !(a.app_id === app.app_id && a.platform === app.platform)))
  }

  function handleAnalyse() {
    if (!selectedApps.length) return
    closeStreams()
    setAnalysisState({ loading: true, error: '', progress: {} })
    setAnalysisData(null)

    let doneCount = 0
    const total = selectedApps.length

    function onStreamDone() {
      doneCount++
      if (doneCount >= total) {
        setAnalysisState(s => ({ ...s, loading: false }))
      }
    }

    for (const app of selectedApps) {
      const params = new URLSearchParams({
        platform: app.platform, app_id: app.app_id, app_name: app.name,
        start_date: dateRange.start, end_date: dateRange.end,
      })
      const es = new EventSource(`/api/reviews/stream?${params}`)
      streamsRef.current.push(es)

      es.addEventListener('batch', e => {
        const { reviews } = JSON.parse(e.data)
        if (!reviews?.length) return

        setAnalysisState(s => ({
          ...s,
          progress: { ...s.progress, [app.platform]: (s.progress[app.platform] ?? 0) + reviews.length },
        }))

        setAnalysisData(prev => {
          const existing    = prev?.byPlatform?.[app.platform]?.reviews ?? []
          const merged      = [...existing, ...reviews]
          const otherReviews = (prev?.reviews ?? []).filter(r => r.platform !== app.platform)
          const allReviews   = [...otherReviews, ...merged]
          return {
            apps: selectedApps,
            reviews: allReviews,
            byPlatform: {
              ...(prev?.byPlatform ?? {}),
              [app.platform]: { reviews: merged, aggregation: aggregateClientSide(merged) },
            },
            aggregation: aggregateClientSide(allReviews),
          }
        })
      })

      es.addEventListener('error', e => {
        try {
          const { message } = JSON.parse(e.data)
          setAnalysisState(s => ({ ...s, error: s.error ? `${s.error}; ${message}` : message }))
        } catch { /* connection error — no data property */ }
        es.close()
        onStreamDone()
      })

      es.addEventListener('done', () => {
        es.close()
        onStreamDone()
      })

      // network-level failure (server down, etc.)
      es.onerror = () => {
        es.close()
        onStreamDone()
      }
    }
  }

  const canAnalyse = selectedApps.length > 0 && !analysisState.loading

  return (
    <div className="app-shell">
      <header className="page-header">
        <h1>App Review Intelligence</h1>
        <p>Search, select one or both platforms, then analyse sentiment over time.</p>
      </header>

      <div className="workspace">

        {/* ── Sidebar ── */}
        <aside>
          <Card>
            <CardHeader title="Configure" subtitle="Select the app and date range to analyse." />

            <div className="sidebar-form">
              <SearchDropdown
                candidates={candidates}
                loading={searchState.loading}
                query={query}
                setQuery={setQuery}
                onSearch={runSearch}
                onSelect={handleSelect}
                selectedApps={selectedApps}
              />

              {searchState.error && (
                <Note variant="error" className="mt-sm">{searchState.error}</Note>
              )}

              {selectedApps.length > 0 && (
                <>
                  <Divider />
                  <SelectedApps apps={selectedApps} onRemove={handleRemove} />
                </>
              )}

              <Divider />

              <div className="date-row">
                <Field label="Start date">
                  <Input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} />
                </Field>
                <Field label="End date">
                  <Input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} />
                </Field>
              </div>

              {selectedApps.length > 0 && (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!canAnalyse}
                    onClick={handleAnalyse}
                  >
                    {analysisState.loading ? 'Analysing…' : `Analyse${selectedApps.length > 1 ? ` (${selectedApps.length} apps)` : ''}`}
                  </Button>

                  {analysisState.error && (
                    <Note variant="error" className="mt-sm">{analysisState.error}</Note>
                  )}
                </>
              )}
            </div>
          </Card>
        </aside>

        {/* ── Main panel ── */}
        <main className="main-content">
          {!analysisData && analysisState.loading ? (
            <div className="analysis-loading">
              <div>
                <Spinner label={`Fetching reviews for ${selectedApps.map(a => a.name).join(' + ')}…`} />
                {Object.entries(analysisState.progress).map(([platform, count]) => (
                  <p key={platform} className="stream-progress-line">
                    {PLATFORM_LABELS[platform]}: {count.toLocaleString()} reviews loaded
                  </p>
                ))}
              </div>
            </div>
          ) : !analysisData ? (
            <div className="analysis-empty">
              <span className="analysis-empty__icon">📊</span>
              <p className="analysis-empty__title">Nothing to show yet</p>
              <p className="analysis-empty__body">Search for an app on the left, select App Store and/or Google Play, then click Analyse.</p>
            </div>
          ) : (
            <>
              {analysisState.loading && (
                <div className="stream-banner">
                  <div className="stream-banner__left">
                    <div className="spinner" aria-hidden="true" />
                    <span>Loading more reviews…</span>
                  </div>
                  <div className="stream-banner__counts">
                    {Object.entries(analysisState.progress).map(([platform, count]) => (
                      <span key={platform}>{PLATFORM_LABELS[platform]}: <strong>{count.toLocaleString()}</strong></span>
                    ))}
                  </div>
                </div>
              )}

              <Card>
                <CardHeader
                  title={analysisData.apps.map(a => a.name).filter((v,i,a)=>a.indexOf(v)===i).join(' + ')}
                  subtitle={`${analysisData.reviews.length} reviews · ${dateRange.start} to ${dateRange.end}`}
                />
                <AnalysisStats data={analysisData} />
              </Card>

              <Card>
                <CardHeader
                  step="Sentiment"
                  title="Sentiment over time"
                  subtitle="VADER compound score per review, aggregated by month."
                />
                <SentimentDistribution reviews={analysisData.reviews} />
                <Divider />
                <SentimentTrendChart
                  ios={analysisData.byPlatform.ios?.aggregation}
                  android={analysisData.byPlatform.android?.aggregation}
                />
                {analysisData.aggregation.length > 0 && (
                  <div className="mt-md">
                    <p className="chart-label">Monthly breakdown</p>
                    <AggregationTable data={analysisData.aggregation} />
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader
                  step="Reviews"
                  title={`All ${analysisData.reviews.length} reviews`}
                  subtitle="Cleaned, deduplicated, and sentiment-scored."
                />
                <ReviewTable reviews={analysisData.reviews} />
              </Card>
            </>
          )}
        </main>

      </div>
    </div>
  )
}
