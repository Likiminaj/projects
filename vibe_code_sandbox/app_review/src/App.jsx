import { useEffect, useMemo, useRef, useState } from 'react'
import { rankApps } from './lib/fuzzy.js'
import { getDefaultDateRange } from './lib/time.js'
import { Button, Badge, Card, CardHeader, Field, Input, Note, Spinner, Divider } from './components/ui.jsx'
import { SentimentTrendChart } from './components/SentimentChart.jsx'

const QUICK_STARTS = ['Zig', 'Grab', 'Uber', 'Bolt', 'Gojek', 'Lyft']

const PLATFORM_COLORS = { ios: 'blue', android: 'green' }
const PLATFORM_LABELS = { ios: 'App Store', android: 'Google Play' }
const PLATFORM_CHART_COLOR = { ios: '#2563EB', android: '#16A34A' }

// ─── Helpers ──────────────────────────────────────────────────────

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadAggregationCSV(data, filename) {
  const cols = ['period', 'review_count', 'avg_rating', 'avg_sentiment', 'positive_count', 'neutral_count', 'negative_count']
  const lines = [cols.join(','), ...data.map(r => cols.map(c => r[c] ?? '').join(','))]
  triggerDownload(lines.join('\n'), filename, 'text/csv')
}

function downloadReviewsCSV(reviews, filename) {
  const cols = ['date', 'platform', 'rating', 'sentiment_label', 'sentiment_score', 'version', 'review_text']
  const escape = v => {
    const s = String(v ?? '')
    return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [cols.join(','), ...reviews.map(r => cols.map(c => escape(r[c])).join(','))]
  triggerDownload(lines.join('\n'), filename, 'text/csv')
}

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

// ─── Sidebar: Google Play search + selection ──────────────────────

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
        <Field label="Search Google Play">
          <div className="search-input-row">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => ranked.length && setOpen(true)}
              placeholder="Company or app name..."
            />
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? '...' : 'Search'}
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
            <button className="selected-chip__remove" onClick={() => onRemove(app)} aria-label="Remove">x</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── iOS upload modal ─────────────────────────────────────────────

function IosUploadModal({ onClose, onReviewsExtracted }) {
  const [appName, setAppName]       = useState('')
  const [files, setFiles]           = useState([])
  const [fileError, setFileError]   = useState('')
  const [parsing, setParsing]       = useState(false)
  const [parseError, setParseError] = useState('')
  const [lastResult, setLastResult] = useState(null)
  const fileRef = useRef(null)

  function handleFileChange(e) {
    const selected = Array.from(e.target.files)
    if (selected.length > 10) {
      setFileError('Maximum 10 screenshots per batch.')
      setFiles([])
      e.target.value = ''
    } else {
      setFileError('')
      setFiles(selected)
    }
  }

  async function handleParse() {
    const name = appName.trim()
    if (!name || !files.length || fileError) return
    setParsing(true)
    setParseError('')
    setLastResult(null)
    try {
      const formData = new FormData()
      formData.append('app_name', name)
      for (const f of files) formData.append('screenshots', f)
      const res  = await fetch('/api/ios/parse', { method: 'POST', body: formData })
      const data = await safeJson(res, 'iOS parse failed')
      if (!res.ok) throw new Error(data.error || 'Parse failed')
      onReviewsExtracted(name, data.reviews ?? [])
      setLastResult({ count: (data.reviews ?? []).length, appName: name })
      setFiles([])
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setParseError(err.message || 'Failed to parse screenshots')
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="ios-modal-title">
        <div className="modal__header">
          <h2 className="modal__title" id="ios-modal-title">Upload iOS Reviews</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">x</button>
        </div>

        <div className="modal__body">
          <p className="modal__desc">
            Upload App Store screenshots in batches of up to 10. Reviews are extracted automatically
            and appended — upload multiple batches for the same app to accumulate more data.
          </p>

          <Field label="App name">
            <Input
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="e.g. Grab, Uber..."
            />
          </Field>

          <Field label="Screenshots (max 10 per batch)">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="file-input"
              onChange={handleFileChange}
            />
          </Field>

          {fileError && <Note variant="error">{fileError}</Note>}
          {!fileError && files.length > 0 && (
            <Note variant="muted">{files.length} file{files.length > 1 ? 's' : ''} selected</Note>
          )}

          {lastResult && (
            <Note variant="success">
              {lastResult.count} review{lastResult.count !== 1 ? 's' : ''} extracted from {lastResult.appName}.
              Upload another batch or click Done.
            </Note>
          )}

          {parseError && <Note variant="error">{parseError}</Note>}
        </div>

        <div className="modal__footer">
          <Button variant="ghost" size="sm" onClick={onClose}>Done</Button>
          <Button
            variant="primary"
            size="sm"
            disabled={parsing || !appName.trim() || !files.length || !!fileError}
            onClick={handleParse}
          >
            {parsing ? 'Extracting...' : 'Extract Reviews'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── iOS apps sidebar list ────────────────────────────────────────

function IosAppsList({ iosApps, onRemove, onOpenModal }) {
  return (
    <div className="ios-section">
      <div className="ios-section__header">
        <p className="ios-upload__label">iOS App Store</p>
        <Button variant="ghost" size="sm" onClick={onOpenModal}>Upload Screenshots</Button>
      </div>

      {iosApps.length > 0 && (
        <div className="selected-apps" style={{ marginTop: 10 }}>
          <p className="selected-apps__label">iOS apps added</p>
          <div className="selected-chips">
            {iosApps.map(app => (
              <div key={app.app_id} className="selected-chip">
                <AppIcon src="" name={app.name} size={30} />
                <div className="selected-chip__info">
                  <span className="selected-chip__name">{app.name}</span>
                  <Badge variant="blue">App Store</Badge>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{app.reviews.length} reviews</span>
                </div>
                <button className="selected-chip__remove" onClick={() => onRemove(app)} aria-label="Remove">x</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Platform comparison ──────────────────────────────────────────

function PlatformComparison({ reviews }) {
  const androidReviews = reviews.filter(r => r.platform === 'android')
  const iosReviews     = reviews.filter(r => r.platform === 'ios')

  if (!androidReviews.length || !iosReviews.length) return null

  function stats(rs) {
    const total     = rs.length
    const pos       = rs.filter(r => r.sentiment_label === 'positive').length
    const neg       = rs.filter(r => r.sentiment_label === 'negative').length
    const avgRating = total ? rs.reduce((s, r) => s + r.rating, 0) / total : 0
    return { total, pos, neg, avgRating }
  }

  const gp  = stats(androidReviews)
  const ios = stats(iosReviews)

  const rows = [
    { label: 'Total Reviews', gp: gp.total.toLocaleString(),                   ios: ios.total.toLocaleString() },
    { label: 'Avg Rating',    gp: gp.avgRating.toFixed(1),                     ios: ios.avgRating.toFixed(1) },
    { label: 'Positive %',    gp: `${Math.round(gp.pos / gp.total * 100)}%`,   ios: `${Math.round(ios.pos / ios.total * 100)}%` },
    { label: 'Negative %',    gp: `${Math.round(gp.neg / gp.total * 100)}%`,   ios: `${Math.round(ios.neg / ios.total * 100)}%` },
  ]

  return (
    <div className="platform-comparison">
      <p className="chart-label" style={{ marginBottom: 10, marginTop: 20 }}>Platform comparison</p>
      <div className="table-wrap" style={{ maxHeight: 'none' }}>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Google Play</th>
              <th>App Store</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <td className="comparison-table__metric">{row.label}</td>
                <td>{row.gp}</td>
                <td>{row.ios}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Scorecard ────────────────────────────────────────────────────

function ScoreMetric({ label, value, color }) {
  return (
    <div className="score-metric">
      <span className="score-metric__label">{label}</span>
      <span className="score-metric__value" style={color ? { color } : {}}>{value}</span>
    </div>
  )
}

function Scorecard({ byApp }) {
  const entries = Object.values(byApp)
  if (!entries.length) return null

  return (
    <div className="scorecard">
      <div className="scorecard__apps">
        {entries.map(({ app, reviews }) => {
          const total     = reviews.length
          const avgRating = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0
          const pos       = reviews.filter(r => r.sentiment_label === 'positive').length
          const neg       = reviews.filter(r => r.sentiment_label === 'negative').length
          const neu       = reviews.filter(r => r.sentiment_label === 'neutral').length
          const avgSent   = total ? reviews.reduce((s, r) => s + (r.sentiment_score ?? 0), 0) / total : 0

          return (
            <div key={app.app_id} className="scorecard__col">
              <div className="scorecard__app-header">
                <AppIcon src={app.icon} name={app.name} size={32} />
                <div style={{ minWidth: 0 }}>
                  <div className="scorecard__app-name">{app.name}</div>
                  <Badge variant={PLATFORM_COLORS[app.platform]}>{PLATFORM_LABELS[app.platform]}</Badge>
                </div>
              </div>
              <div className="scorecard__metrics">
                <ScoreMetric label="Reviews"       value={total.toLocaleString()} />
                <ScoreMetric label="Avg Rating"    value={total ? avgRating.toFixed(1) : '-'} />
                <ScoreMetric label="Positive"      value={total ? `${Math.round(pos / total * 100)}%` : '-'} color="var(--green)" />
                <ScoreMetric label="Neutral"       value={total ? `${Math.round(neu / total * 100)}%` : '-'} color="var(--text-muted)" />
                <ScoreMetric label="Negative"      value={total ? `${Math.round(neg / total * 100)}%` : '-'} color="var(--red)" />
                <ScoreMetric label="Avg Sentiment" value={total ? (avgSent >= 0 ? '+' : '') + avgSent.toFixed(3) : '-'} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Per-app review breakdown with dropdown ───────────────────────

function ReviewTable({ reviews, filename = 'reviews.csv' }) {
  return (
    <div>
      <div className="section-row" style={{ marginBottom: 12 }}>
        <span />
        <Button variant="ghost" size="sm" onClick={() => downloadReviewsCSV(reviews, filename)}>
          Download CSV
        </Button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Review</th>
              <th>Rating</th>
              <th>Sentiment</th>
              <th>Date</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r, idx) => {
              const sv   = r.sentiment_label === 'positive' ? 'green' : r.sentiment_label === 'negative' ? 'red' : 'default'
              const sign = r.sentiment_score > 0 ? '+' : ''
              return (
                <tr key={`${r.platform ?? ''}-${r.review_id ?? idx}-${r.date ?? ''}`}>
                  <td>{r.review_text}</td>
                  <td>{r.rating} / 5</td>
                  <td>
                    <div className="sentiment-cell">
                      <Badge variant={sv}>{r.sentiment_label ?? '-'}</Badge>
                      {r.sentiment_score != null && (
                        <span className={`sentiment-score sentiment-${r.sentiment_label ?? 'neutral'}`}>
                          {sign}{r.sentiment_score}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{r.date ?? '-'}</td>
                  <td>{r.version ?? '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AggregationTable({ data, filename = 'aggregation.csv' }) {
  return (
    <div>
      <div className="section-row">
        <p className="chart-label">Monthly breakdown</p>
        <Button variant="ghost" size="sm" onClick={() => downloadAggregationCSV(data, filename)}>
          Download CSV
        </Button>
      </div>
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
    </div>
  )
}

function ReviewDropdown({ byApp, progress }) {
  const keys = Object.keys(byApp)
  const [selected, setSelected] = useState(keys[0] ?? '')
  const effectiveKey = keys.includes(selected) ? selected : (keys[0] ?? '')
  const appData = byApp[effectiveKey]

  if (!appData) return null

  const { app, reviews, aggregation } = appData
  const inProgress = progress[effectiveKey]
  const baseName   = `${app.name}-${app.platform}`

  return (
    <Card>
      <CardHeader step="Reviews" title="Review breakdown" subtitle="Select an app to explore its reviews." />

      <div className="app-select-row">
        <select
          className="app-select"
          value={effectiveKey}
          onChange={e => setSelected(e.target.value)}
        >
          {keys.map(k => {
            const a   = byApp[k].app
            const cnt = byApp[k].reviews.length
            return (
              <option key={k} value={k}>
                {a.name} - {PLATFORM_LABELS[a.platform]} - {cnt.toLocaleString()} reviews{progress[k] && byApp[k].reviews.length === 0 ? ' (loading...)' : ''}
              </option>
            )
          })}
        </select>
      </div>

      {inProgress !== undefined && (
        <Note variant="muted" style={{ marginBottom: 12 }}>
          Streaming... {inProgress.toLocaleString()} reviews loaded so far
        </Note>
      )}

      {aggregation.length > 0 && (
        <>
          <SentimentTrendChart
            data={aggregation}
            color={PLATFORM_CHART_COLOR[app.platform]}
            filename={`${baseName}-sentiment.png`}
          />
          <Divider />
          <AggregationTable data={aggregation} filename={`${baseName}-monthly.csv`} />
          <Divider />
        </>
      )}

      {reviews.length > 0 ? (
        <ReviewTable reviews={reviews} filename={`${baseName}-reviews.csv`} />
      ) : (
        <Note variant="muted">No reviews yet for this app.</Note>
      )}
    </Card>
  )
}

// ─── Main app ─────────────────────────────────────────────────────

export default function App() {
  const [query, setQuery]               = useState('')
  const [candidates, setCandidates]     = useState([])
  const [searchState, setSearchState]   = useState({ loading: false, error: '' })
  const [selectedApps, setSelectedApps] = useState([])
  const [dateRange, setDateRange]       = useState(() => getDefaultDateRange())
  const [analysisState, setAnalysisState] = useState({ loading: false, error: '', progress: {} })
  const [analysisData, setAnalysisData]   = useState(null)
  const streamsRef = useRef([])

  const [iosApps, setIosApps]           = useState([])
  const [iosModalOpen, setIosModalOpen] = useState(false)

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
      if (prev.some(a => a.app_id === app.app_id && a.platform === app.platform)) return prev
      return [...prev, app]
    })
  }

  function handleRemove(app) {
    setSelectedApps(prev => prev.filter(a => !(a.app_id === app.app_id && a.platform === app.platform)))
  }

  function handleRemoveIos(app) {
    setIosApps(prev => prev.filter(a => a.app_id !== app.app_id))
  }

  // Appends extracted reviews to an existing iOS app entry, or creates a new one.
  // Deduplicates by review_id (if present) or exact review_text.
  function handleReviewsExtracted(appName, reviews) {
    if (!reviews.length) return
    setIosApps(prev => {
      const existing = prev.find(a => a.name.toLowerCase() === appName.toLowerCase())
      if (existing) {
        const seen  = new Set(existing.reviews.map(r => r.review_id ?? r.review_text))
        const fresh = reviews
          .map(r => ({ ...r, app_id: existing.app_id }))
          .filter(r => !seen.has(r.review_id ?? r.review_text))
        return prev.map(a =>
          a.app_id === existing.app_id ? { ...a, reviews: [...a.reviews, ...fresh] } : a
        )
      }
      const appId = `ios_${Date.now()}`
      return [...prev, {
        app_id:   appId,
        name:     appName,
        platform: 'ios',
        reviews:  reviews.map(r => ({ ...r, app_id: appId })),
        icon:     '',
        store:    'App Store',
      }]
    })
  }

  function handleAnalyse() {
    const allApps = [...selectedApps, ...iosApps]
    if (!allApps.length) return
    closeStreams()

    const initByApp = {}
    let initReviews = []
    for (const app of iosApps) {
      initByApp[app.app_id] = { app, reviews: app.reviews, aggregation: aggregateClientSide(app.reviews) }
      initReviews = [...initReviews, ...app.reviews]
    }
    const initData = { apps: allApps, reviews: initReviews, byApp: initByApp, aggregation: aggregateClientSide(initReviews) }

    if (!selectedApps.length) {
      setAnalysisData(initData)
      setAnalysisState({ loading: false, error: '', progress: {} })
      return
    }

    setAnalysisState({ loading: true, error: '', progress: {} })
    setAnalysisData(initReviews.length ? initData : null)

    let doneCount = 0

    function onStreamDone() {
      doneCount++
      if (doneCount >= selectedApps.length) {
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
        const { reviews: raw } = JSON.parse(e.data)
        if (!raw?.length) return
        const reviews = raw.map(r => ({ ...r, app_id: app.app_id }))

        setAnalysisState(s => ({
          ...s,
          progress: { ...s.progress, [app.app_id]: (s.progress[app.app_id] ?? 0) + reviews.length },
        }))

        setAnalysisData(prev => {
          const prevAppReviews = prev?.byApp?.[app.app_id]?.reviews ?? []
          const merged         = [...prevAppReviews, ...reviews]
          const others         = (prev?.reviews ?? []).filter(r => r.app_id !== app.app_id)
          const all            = [...others, ...merged]
          return {
            apps: allApps,
            reviews: all,
            byApp: {
              ...(prev?.byApp ?? initByApp),
              [app.app_id]: { app, reviews: merged, aggregation: aggregateClientSide(merged) },
            },
            aggregation: aggregateClientSide(all),
          }
        })
      })

      es.addEventListener('error', e => {
        try {
          const { message } = JSON.parse(e.data)
          setAnalysisState(s => ({ ...s, error: s.error ? `${s.error}; ${message}` : message }))
        } catch { /* connection error */ }
        es.close()
        onStreamDone()
      })

      es.addEventListener('done', () => { es.close(); onStreamDone() })
      es.onerror = () => { es.close(); onStreamDone() }
    }
  }

  const canAnalyse      = (selectedApps.length > 0 || iosApps.length > 0) && !analysisState.loading
  const allSelectedApps = [...selectedApps, ...iosApps]
  const appById         = Object.fromEntries(allSelectedApps.map(a => [a.app_id, a]))

  return (
    <div className="app-shell">
      <header className="page-header">
        <h1>App Review Intelligence</h1>
        <p>Compare Google Play apps side-by-side, or add iOS apps via App Store screenshots.</p>
      </header>

      <div className="workspace">

        {/* Sidebar */}
        <aside>
          <Card>
            <CardHeader title="Configure" subtitle="Select apps and date range to analyse." />

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

              <IosAppsList
                iosApps={iosApps}
                onRemove={handleRemoveIos}
                onOpenModal={() => setIosModalOpen(true)}
              />

              <Divider />

              <div className="date-row">
                <Field label="Start date">
                  <Input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} />
                </Field>
                <Field label="End date">
                  <Input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} />
                </Field>
              </div>

              {allSelectedApps.length > 0 && (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!canAnalyse}
                    onClick={handleAnalyse}
                  >
                    {analysisState.loading
                      ? 'Analysing...'
                      : `Analyse${allSelectedApps.length > 1 ? ` (${allSelectedApps.length} apps)` : ''}`}
                  </Button>

                  {analysisState.error && (
                    <Note variant="error" className="mt-sm">{analysisState.error}</Note>
                  )}
                </>
              )}
            </div>
          </Card>
        </aside>

        {/* Main panel */}
        <main className="main-content">
          {!analysisData && analysisState.loading ? (
            <div className="analysis-loading">
              <div>
                <Spinner label={`Fetching reviews for ${selectedApps.map(a => a.name).join(', ')}...`} />
                {Object.entries(analysisState.progress).map(([id, count]) => (
                  <p key={id} className="stream-progress-line">
                    {appById[id]?.name ?? id}: {count.toLocaleString()} reviews loaded
                  </p>
                ))}
              </div>
            </div>
          ) : !analysisData ? (
            <div className="analysis-empty">
              <span className="analysis-empty__icon">chart</span>
              <p className="analysis-empty__title">Nothing to show yet</p>
              <p className="analysis-empty__body">Search for Google Play apps or add iOS screenshots, then click Analyse.</p>
            </div>
          ) : (
            <>
              {analysisState.loading && (
                <div className="stream-banner">
                  <div className="stream-banner__left">
                    <div className="spinner" aria-hidden="true" />
                    <span>Loading more reviews...</span>
                  </div>
                  <div className="stream-banner__counts">
                    {Object.entries(analysisState.progress).map(([id, count]) => (
                      <span key={id}>{appById[id]?.name ?? id}: <strong>{count.toLocaleString()}</strong></span>
                    ))}
                  </div>
                </div>
              )}

              <Card>
                <CardHeader
                  title="Overview"
                  subtitle={`${analysisData.reviews.length} total reviews - ${dateRange.start} to ${dateRange.end}`}
                />
                <Scorecard byApp={analysisData.byApp} />
                <PlatformComparison reviews={analysisData.reviews} />
              </Card>

              <ReviewDropdown byApp={analysisData.byApp} progress={analysisState.progress} />
            </>
          )}
        </main>

      </div>

      {iosModalOpen && (
        <IosUploadModal
          onClose={() => setIosModalOpen(false)}
          onReviewsExtracted={handleReviewsExtracted}
        />
      )}
    </div>
  )
}
