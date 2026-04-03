import { useEffect, useState, useRef } from 'react'
import CircularRing from '../../components/CircularRing.jsx'
import HabitModal from './HabitModal.jsx'

// ── Date utils ────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10) }

function weekStart(dateStr) {
  const d = new Date(dateStr)
  const dow = d.getDay()
  d.setDate(d.getDate() - dow + (dow === 0 ? -6 : 1))
  return d.toISOString().slice(0, 10)
}

function weekEnd(startStr) {
  const d = new Date(startStr)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00').toLocaleDateString('en-SG', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ── Cadence logic ─────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isHabitDueOn(habit, dateStr, weekLogsMap) {
  if (habit.startDate && dateStr < habit.startDate) return false
  if (habit.endDate   && dateStr > habit.endDate)   return false
  const dow = new Date(dateStr + 'T00:00').getDay()
  if (habit.cadence === 'Daily')  return true
  if (habit.cadence === 'Custom') return (habit.cadenceDays ?? []).includes(DAY_NAMES[dow])
  if (habit.cadence === 'Weekly') {
    // Show on any day this week until it's been Completed once this week
    const weekLogs = weekLogsMap[habit.id] ?? []
    return !weekLogs.some(l => l.status === 'Completed')
  }
  return true
}

// ── Category chip colors ──────────────────────────────────────────
const CAT_COLORS = {
  Health:       { bg: 'var(--green-light)',   text: '#1e5c1b' },
  Work:         { bg: 'var(--sky-light)',     text: '#1A5C8A' },
  Personal:     { bg: 'var(--lavender-light)',text: '#5B3D7A' },
  Learning:     { bg: 'var(--amber-light)',   text: '#7a5000' },
  Finance:      { bg: 'var(--green-light)',   text: '#1e5c1b' },
  Social:       { bg: '#FCE8F3',              text: '#8A2C62' },
  Mindfulness:  { bg: 'var(--lavender-light)',text: '#5B3D7A' },
}

function CatChip({ category }) {
  if (!category) return null
  const c = CAT_COLORS[category] ?? { bg: 'var(--bg-sunken)', text: 'var(--text-secondary)' }
  return (
    <span style={{
      background: c.bg, color: c.text, borderRadius: 999,
      padding: '2px 8px', fontSize: 9, fontWeight: 700, flexShrink: 0,
    }}>{category}</span>
  )
}

// ── Today view ────────────────────────────────────────────────────
function TodayView({ habits, weekLogsMap, todayLogs, loggingIds, onLog, onLogValue }) {
  const today = todayStr()
  const dueHabits = habits.filter(h => h.status === 'Active' && isHabitDueOn(h, today, weekLogsMap))
  const completedCount = dueHabits.filter(h => {
    const log = todayLogs[h.id]
    return log?.status === 'Completed'
  }).length
  const pct = dueHabits.length > 0 ? Math.round((completedCount / dueHabits.length) * 100) : 0

  const allDone = dueHabits.length > 0 && completedCount === dueHabits.length

  async function logAll() {
    const pending = dueHabits.filter(h => !todayLogs[h.id] || todayLogs[h.id].status === 'Missed')
    for (const h of pending) await onLog(h.id, 'Completed')
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <CircularRing
          percent={pct} size={72} stroke={6}
          color={allDone ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--coral)'}
          label={`${pct}%`}
        />
        <div>
          <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>
            {allDone ? 'All done!' : `${completedCount} / ${dueHabits.length} habits`}
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {formatDate(today)}
          </p>
        </div>
        {dueHabits.length > 0 && !allDone && (
          <button className="ds-btn ds-btn--ghost" style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)' }}
            onClick={logAll}>Log all ✓</button>
        )}
      </div>

      {dueHabits.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)' }}>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 8 }}>No habits due today</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Create habits in the Manage tab to get started.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dueHabits.map(h => {
          const log = todayLogs[h.id]
          const status = log?.status ?? null
          const isLogging = loggingIds.has(h.id)
          const completed = status === 'Completed'
          const skipped   = status === 'Skipped'

          return (
            <div key={h.id} style={{
              background: completed ? 'var(--green-light)' : skipped ? 'var(--bg-sunken)' : 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${completed ? 'var(--green)' : 'var(--border)'}`,
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: isLogging ? 0.6 : 1,
              transition: 'background 200ms, border-color 200ms, opacity 150ms',
            }}>
              {/* Completion indicator */}
              <button
                disabled={isLogging}
                onClick={() => !completed ? onLog(h.id, 'Completed') : onLog(h.id, null)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${completed ? 'var(--green)' : 'var(--border)'}`,
                  background: completed ? 'var(--green)' : 'transparent',
                  cursor: isLogging ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 180ms',
                }}
              >
                {completed && <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>✓</span>}
              </button>

              {/* Habit info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{
                    fontWeight: 700, fontSize: 'var(--text-sm)',
                    color: skipped ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: skipped ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{h.name}</span>
                  <CatChip category={h.category} />
                </div>
                <p style={{ margin: 0, fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {h.cadence}{h.cadence === 'Custom' ? ` · ${h.cadenceDays.join(', ')}` : ''}
                  {h.type === 'Quantitative' && h.targetValue
                    ? ` · Target: ${h.targetValue.toLocaleString()} ${h.targetUnit}` : ''}
                </p>
              </div>

              {/* Quantitative value input */}
              {h.type === 'Quantitative' && completed && log?.value != null && (
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#1e5c1b', flexShrink: 0 }}>
                  {log.value.toLocaleString()} {h.targetUnit}
                </span>
              )}
              {h.type === 'Quantitative' && !completed && (
                <QuantInput habit={h} isLogging={isLogging} onLogValue={onLogValue} />
              )}

              {/* Skip button */}
              {!completed && (
                <button
                  disabled={isLogging}
                  onClick={() => onLog(h.id, skipped ? null : 'Skipped')}
                  title={skipped ? 'Undo skip' : 'Skip today'}
                  style={{
                    background: 'none', border: 'none', cursor: isLogging ? 'wait' : 'pointer',
                    color: skipped ? 'var(--text-tertiary)' : 'var(--text-tertiary)',
                    fontSize: 16, lineHeight: 1, padding: '4px 6px',
                    opacity: skipped ? 1 : 0.5,
                    transition: 'opacity 120ms',
                  }}
                >—</button>
              )}
            </div>
          )
        })}
      </div>

      {/* Other habits (not due today) */}
      {(() => {
        const notDue = habits.filter(h => h.status === 'Active' && !isHabitDueOn(h, today, weekLogsMap))
        if (notDue.length === 0) return null
        return (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Not scheduled today
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {notDue.map(h => (
                <div key={h.id} style={{
                  background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6,
                }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, flex: 1 }}>{h.name}</span>
                  <CatChip category={h.category} />
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{h.cadence}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function QuantInput({ habit, isLogging, onLogValue }) {
  const [val, setVal] = useState('')
  const inputRef = useRef(null)
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="number" min="0" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && val) onLogValue(habit.id, Number(val)) }}
        placeholder={String(habit.targetValue ?? '')}
        disabled={isLogging}
        style={{
          width: 70, padding: '4px 6px', borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--border)', background: 'var(--bg-sunken)',
          fontSize: 'var(--text-sm)', fontFamily: 'inherit', textAlign: 'right',
        }}
      />
      <span style={{ fontSize: 9, color: 'var(--text-tertiary)', flexShrink: 0 }}>{habit.targetUnit}</span>
      {val && (
        <button
          disabled={isLogging}
          onClick={() => { onLogValue(habit.id, Number(val)); setVal('') }}
          style={{
            background: 'var(--green)', border: 'none', borderRadius: 'var(--radius-sm)',
            color: '#fff', fontSize: 12, padding: '4px 8px', cursor: 'pointer', fontWeight: 700,
          }}
        >✓</button>
      )}
    </div>
  )
}

// ── Manage view ───────────────────────────────────────────────────
function ManageView({ habits, todayLogs, weekLogsMap, onAdd, onEdit, onArchive, onDelete, showArchived, setShowArchived }) {
  const active   = habits.filter(h => h.status === 'Active')
  const archived = habits.filter(h => h.status === 'Archived')

  const today = todayStr()

  function cadenceLabel(h) {
    if (h.cadence === 'Custom') return h.cadenceDays.join(' · ')
    return h.cadence
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="ds-btn ds-btn--primary" onClick={onAdd}>+ New Habit</button>
      </div>

      {active.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)' }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>No active habits</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Create your first habit to start tracking.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {active.map(h => {
          const due = isHabitDueOn(h, today, weekLogsMap)
          const log = todayLogs[h.id]
          const logStatus = log?.status ?? (due ? 'pending' : 'off')

          return (
            <div key={h.id} className="ds-card ds-card--padded" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Status dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: logStatus === 'Completed' ? 'var(--green)'
                    : logStatus === 'Skipped' ? 'var(--text-tertiary)'
                    : logStatus === 'pending' ? 'var(--amber)'
                    : 'var(--bg-sunken)',
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{h.name}</span>
                    <CatChip category={h.category} />
                    {h.type === 'Quantitative' && (
                      <span style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        {h.targetValue?.toLocaleString()} {h.targetUnit}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 9, color: 'var(--text-tertiary)' }}>
                    {cadenceLabel(h)}
                    {h.startDate ? ` · from ${h.startDate}` : ''}
                    {h.endDate   ? ` → ${h.endDate}`        : ''}
                    {' · '}{'★'.repeat(h.importance)}{'☆'.repeat(5 - h.importance)}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ds-btn ds-btn--ghost" style={{ padding: '4px 10px', fontSize: 'var(--text-sm)' }}
                    onClick={() => onEdit(h)}>Edit</button>
                  <button
                    style={{
                      padding: '4px 10px', fontSize: 'var(--text-sm)',
                      background: 'none', border: '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                    }}
                    onClick={() => onArchive(h)}>Archive</button>
                  <button
                    style={{
                      padding: '4px 6px', fontSize: 'var(--text-sm)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--coral)', opacity: 0.6,
                    }}
                    onClick={() => onDelete(h)}>✕</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {archived.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: 0, marginBottom: 10 }}
            onClick={() => setShowArchived(v => !v)}
          >
            {showArchived ? '▾' : '▸'} Archived ({archived.length})
          </button>
          {showArchived && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {archived.map(h => (
                <div key={h.id} style={{
                  background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)',
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.65,
                }}>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h.name}</span>
                  <CatChip category={h.category} />
                  <button className="ds-btn ds-btn--ghost" style={{ fontSize: 'var(--text-sm)', padding: '4px 10px' }}
                    onClick={() => onEdit({ ...h, status: 'Active' })}>Restore</button>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', fontSize: 12, padding: '4px 6px' }}
                    onClick={() => onDelete(h)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Review view ───────────────────────────────────────────────────
function ReviewView() {
  const [period, setPeriod]     = useState('month')
  const [data,   setData]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [reflection, setReflection] = useState(() => {
    try { return JSON.parse(localStorage.getItem('habits-reflection') ?? '{}') } catch { return {} }
  })

  const periodKey = `${period}-${new Date().toISOString().slice(0, 7)}`

  function saveReflection(key, val) {
    const next = { ...reflection, [`${periodKey}-${key}`]: val }
    setReflection(next)
    localStorage.setItem('habits-reflection', JSON.stringify(next))
  }

  function getRef(key) { return reflection[`${periodKey}-${key}`] ?? '' }

  useEffect(() => {
    setLoading(true)
    fetch(`/api/habits/review?period=${period}`)
      .then(r => r.json())
      .then(j => { if (j.success) setData(j.data) })
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['week', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '6px 16px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
            background: period === p ? 'var(--amber)' : 'var(--bg-sunken)',
            color: period === p ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: period === p ? 700 : 500, fontSize: 'var(--text-sm)',
            transition: 'all 150ms',
          }}>
            {p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading review…</p>}

      {!loading && data && (
        <>
          {/* Overall ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <CircularRing
              percent={data.overall.rate} size={80} stroke={7}
              color={data.overall.rate >= 80 ? 'var(--green)' : data.overall.rate >= 50 ? 'var(--amber)' : 'var(--coral)'}
              label={`${data.overall.rate}%`}
            />
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 800 }}>{data.overall.rate}%</p>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {data.overall.completed} / {data.overall.scheduled} completions
              </p>
              <p style={{ margin: 0, fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {data.from} → {data.to}
              </p>
            </div>
          </div>

          {/* Per-habit breakdown */}
          {data.habits.filter(h => h.scheduled > 0).length > 0 && (
            <div className="ds-card ds-card--padded" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 14 }}>Performance</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.habits.filter(h => h.scheduled > 0).map(h => (
                  <div key={h.habitId}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h.name}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                        {h.currentStreak > 0 ? `🔥 ${h.currentStreak}` : ''}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700,
                        color: h.trend > 0 ? '#1e5c1b' : h.trend < 0 ? '#9a2a1a' : 'var(--text-tertiary)',
                      }}>
                        {h.trend > 0 ? `▲${h.trend}%` : h.trend < 0 ? `▼${Math.abs(h.trend)}%` : ''}
                      </span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, minWidth: 32, textAlign: 'right' }}>
                        {h.completionRate}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${h.completionRate}%`,
                        background: h.completionRate >= 80 ? 'var(--green)' : h.completionRate >= 50 ? 'var(--amber)' : 'var(--coral)',
                        borderRadius: 99, transition: 'width 500ms var(--ease)',
                      }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                      <span style={{ fontSize: 9, color: '#1e5c1b' }}>{h.completed} done</span>
                      {h.missed > 0 && <span style={{ fontSize: 9, color: '#9a2a1a' }}>{h.missed} missed</span>}
                      {h.skipped > 0 && <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{h.skipped} skipped</span>}
                      {h.longestStreak > 0 && <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>best: {h.longestStreak}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {data.insights.mostConsistent.length > 0 && (
              <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 700, color: '#1e5c1b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Strongest</p>
                {data.insights.mostConsistent.map(h => (
                  <div key={h.habitId} style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h.name}</span>
                    <span style={{ fontSize: 9, color: '#1e5c1b', marginLeft: 6 }}>{h.completionRate}%</span>
                  </div>
                ))}
              </div>
            )}
            {data.insights.needsAttention.length > 0 && (
              <div style={{ background: 'var(--coral-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 700, color: '#9a2a1a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Needs Attention</p>
                {data.insights.needsAttention.map(h => (
                  <div key={h.habitId} style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h.name}</span>
                    <span style={{ fontSize: 9, color: '#9a2a1a', marginLeft: 6 }}>{h.completionRate}%</span>
                  </div>
                ))}
              </div>
            )}
            {data.insights.improving.length > 0 && (
              <div style={{ background: 'var(--sky-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 700, color: '#1A5C8A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Improving ▲</p>
                {data.insights.improving.map(h => (
                  <div key={h.habitId} style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h.name}</span>
                    <span style={{ fontSize: 9, color: '#1A5C8A', marginLeft: 6 }}>+{h.trend}% vs last</span>
                  </div>
                ))}
              </div>
            )}
            {data.insights.weekendWeak.length > 0 && (
              <div style={{ background: 'var(--amber-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 700, color: '#7a5000', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weekend Dip</p>
                {data.insights.weekendWeak.map((name, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {data.suggestions?.length > 0 && (
            <div className="ds-card ds-card--padded" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 10 }}>Suggested Actions</p>
              {data.suggestions.map((s, i) => (
                <div key={i} style={{
                  padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)',
                  marginBottom: i < data.suggestions.length - 1 ? 8 : 0,
                }}>
                  <p style={{ margin: '0 0 2px', fontSize: 'var(--text-sm)', fontWeight: 700 }}>{s.name}</p>
                  <p style={{ margin: 0, fontSize: 9, color: 'var(--text-secondary)' }}>{s.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reflection */}
          <div className="ds-card ds-card--padded">
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 14 }}>Reflection</p>
            {[
              { key: 'worked',  label: 'What worked well this period?' },
              { key: 'didnt',   label: "What didn't go as planned?" },
              { key: 'change',  label: 'What will you adjust next period?' },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  {label}
                </label>
                <textarea
                  value={getRef(key)}
                  onChange={e => saveReflection(key, e.target.value)}
                  rows={2}
                  placeholder="Write your thoughts…"
                  style={{
                    width: '100%', padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
                    background: 'var(--bg-sunken)', resize: 'vertical',
                    fontFamily: 'inherit', fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !data && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)' }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>No data yet</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Configure NOTION_HABITS_DB and NOTION_HABIT_LOGS_DB, then add some habits.</p>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
const TABS = ['Today', 'Manage', 'Review']

export default function HabitsPage() {
  const [tab,    setTab]    = useState('Today')
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(false)

  // Logs: { [habitId]: log } for today
  const [todayLogs,   setTodayLogs]   = useState({})
  // Logs: { [habitId]: Log[] } for this week (for weekly cadence)
  const [weekLogsMap, setWeekLogsMap] = useState({})
  const [loggingIds,  setLoggingIds]  = useState(new Set())

  const [showHabitModal, setShowHabitModal] = useState(false)
  const [editHabit,      setEditHabit]      = useState(null)
  const [showArchived,   setShowArchived]   = useState(false)
  const [deleteConfirm,  setDeleteConfirm]  = useState(null)

  const today     = todayStr()
  const wStart    = weekStart(today)
  const wEnd      = weekEnd(wStart)

  async function fetchHabits() {
    setLoading(true)
    try {
      const [activeRes, archivedRes] = await Promise.all([
        fetch('/api/habits?status=Active').then(r => r.json()),
        fetch('/api/habits?status=Archived').then(r => r.json()),
      ])
      const all = [
        ...(activeRes.success  ? activeRes.data  : []),
        ...(archivedRes.success ? archivedRes.data : []),
      ]
      setHabits(all)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLogs() {
    const res  = await fetch(`/api/habits/logs?from=${wStart}&to=${wEnd}`)
    const json = await res.json()
    if (!json.success) return
    const todayMap = {}
    const weekMap  = {}
    for (const log of json.data) {
      if (!log.habitId) continue
      if (log.date === today) todayMap[log.habitId] = log
      if (!weekMap[log.habitId]) weekMap[log.habitId] = []
      weekMap[log.habitId].push(log)
    }
    setTodayLogs(todayMap)
    setWeekLogsMap(weekMap)
  }

  useEffect(() => {
    fetchHabits()
    fetchLogs()
  }, [])

  // ── Logging actions ───────────────────────────────────────────
  async function handleLog(habitId, status) {
    setLoggingIds(s => new Set([...s, habitId]))
    try {
      if (status === null) {
        // Undo — delete today's log
        const existing = todayLogs[habitId]
        if (existing) {
          await fetch(`/api/habits/logs/${existing.id}`, { method: 'DELETE' })
          setTodayLogs(prev => { const n = { ...prev }; delete n[habitId]; return n })
          setWeekLogsMap(prev => ({
            ...prev,
            [habitId]: (prev[habitId] ?? []).filter(l => l.id !== existing.id),
          }))
        }
      } else {
        const res  = await fetch('/api/habits/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habitId, date: today, status }),
        })
        const json = await res.json()
        if (json.success) {
          setTodayLogs(prev => ({ ...prev, [habitId]: json.data }))
          setWeekLogsMap(prev => {
            const existing = (prev[habitId] ?? []).filter(l => l.date !== today)
            return { ...prev, [habitId]: [json.data, ...existing] }
          })
        }
      }
    } finally {
      setLoggingIds(s => { const n = new Set(s); n.delete(habitId); return n })
    }
  }

  async function handleLogValue(habitId, value) {
    setLoggingIds(s => new Set([...s, habitId]))
    try {
      const res  = await fetch('/api/habits/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date: today, status: 'Completed', value }),
      })
      const json = await res.json()
      if (json.success) {
        setTodayLogs(prev => ({ ...prev, [habitId]: json.data }))
        setWeekLogsMap(prev => {
          const existing = (prev[habitId] ?? []).filter(l => l.date !== today)
          return { ...prev, [habitId]: [json.data, ...existing] }
        })
      }
    } finally {
      setLoggingIds(s => { const n = new Set(s); n.delete(habitId); return n })
    }
  }

  // ── Habit CRUD ────────────────────────────────────────────────
  function handleHabitSaved(habit, isEdit) {
    if (isEdit) {
      setHabits(prev => prev.map(h => h.id === habit.id ? habit : h))
    } else {
      setHabits(prev => [...prev, habit])
    }
    setShowHabitModal(false)
    setEditHabit(null)
  }

  async function handleArchive(habit) {
    const res  = await fetch(`/api/habits/${habit.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'archive' }),
    })
    const json = await res.json()
    if (json.success) setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, status: 'Archived' } : h))
  }

  function handleDeleteClick(habit) {
    setDeleteConfirm(habit)
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    const res  = await fetch(`/api/habits/${deleteConfirm.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'delete' }),
    })
    const json = await res.json()
    if (json.success) setHabits(prev => prev.filter(h => h.id !== deleteConfirm.id))
    setDeleteConfirm(null)
  }

  return (
    <div className="ds-page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="ds-heading" style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Habits</h1>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'var(--bg-sunken)', borderRadius: 'var(--radius-pill)', padding: 4 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '7px 0', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
            background: tab === t ? 'var(--bg-surface)' : 'transparent',
            boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: tab === t ? 700 : 500, fontSize: 'var(--text-sm)',
            transition: 'all 150ms',
          }}>{t}</button>
        ))}
      </div>

      {loading && tab !== 'Review' && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading…</p>
      )}

      {!loading && tab === 'Today' && (
        <TodayView
          habits={habits}
          weekLogsMap={weekLogsMap}
          todayLogs={todayLogs}
          loggingIds={loggingIds}
          onLog={handleLog}
          onLogValue={handleLogValue}
        />
      )}

      {!loading && tab === 'Manage' && (
        <ManageView
          habits={habits}
          todayLogs={todayLogs}
          weekLogsMap={weekLogsMap}
          onAdd={() => { setEditHabit(null); setShowHabitModal(true) }}
          onEdit={h => { setEditHabit(h); setShowHabitModal(true) }}
          onArchive={handleArchive}
          onDelete={handleDeleteClick}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
        />
      )}

      {tab === 'Review' && <ReviewView />}

      {/* Create / Edit modal */}
      {showHabitModal && (
        <HabitModal
          habit={editHabit}
          onClose={() => { setShowHabitModal(false); setEditHabit(null) }}
          onSaved={handleHabitSaved}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}>
          <div className="ds-modal" style={{ maxWidth: 360 }}>
            <div className="ds-modal__header">
              <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>Delete Habit?</h2>
              <button className="ds-modal__close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="ds-modal__body">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 20 }}>
                Permanently delete <strong>{deleteConfirm.name}</strong> and all its logs? This cannot be undone.<br />
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                  Tip: use Archive to keep history.
                </span>
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="ds-btn ds-btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button
                  onClick={confirmDelete}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                    background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)',
                  }}
                >Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
