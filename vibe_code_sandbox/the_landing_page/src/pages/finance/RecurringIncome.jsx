import { useEffect, useState } from 'react'
import AddRecurringModal from './AddRecurringModal.jsx'
import LogRecurringModal from './LogRecurringModal.jsx'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatPeriod(activeFrom, activeUntil) {
  const fmt = key => {
    if (!key) return null
    const [y, m] = key.split('-').map(Number)
    const thisYear = new Date().getFullYear()
    return y === thisYear ? MONTH_SHORT[m - 1] : `${MONTH_SHORT[m - 1]} '${String(y).slice(2)}`
  }
  const from = fmt(activeFrom)
  const until = fmt(activeUntil)
  if (from && until) return `${from}–${until}`
  if (until) return `until ${until}`
  if (from)  return `from ${from}`
  return null
}

function PeriodPill({ activeFrom, activeUntil }) {
  const label = formatPeriod(activeFrom, activeUntil)
  if (!label) return null
  return (
    <span style={{
      background: 'var(--amber-light)', color: '#7a5000',
      borderRadius: 999, padding: '2px 8px',
      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
    }}>{label}</span>
  )
}

function fmtAmount(amount) {
  if (amount === null || amount === undefined) return '—'
  return `$${Number(amount).toFixed(2)}`
}

function FrequencyPill({ frequency }) {
  const map = {
    Monthly: { bg: '#DDF0F8', text: '#1A5C8A' },
    Yearly:  { bg: '#D6EDCF', text: '#1E5C1B' },
    Annual:  { bg: '#D6EDCF', text: '#1E5C1B' },
  }
  const c     = map[frequency] ?? { bg: '#F0EBE3', text: '#78716C' }
  const label = frequency === 'Annual' ? 'Yearly' : (frequency ?? '—')
  return (
    <span style={{
      background: c.bg, color: c.text, borderRadius: 999,
      padding: '2px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
    }}>{label}</span>
  )
}

function DirectionDot({ direction }) {
  const bg = direction === 'Income'  ? 'var(--green)'
           : direction === 'Expense' ? 'var(--coral)'
           : 'var(--border)'
  return <span style={{ display: 'inline-block', flexShrink: 0, width: 7, height: 7, borderRadius: '50%', background: bg }} />
}

function SectionHeader({ label, count, extra }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px 8px', borderBottom: '1px solid var(--border)',
    }}>
      <span className="ds-label">{label}</span>
      <span style={{
        background: 'var(--bg-sunken)', color: 'var(--text-tertiary)',
        borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700,
      }}>{count}</span>
      {extra && (
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)' }}>
          {extra}
        </span>
      )}
    </div>
  )
}

export default function RecurringIncome() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [tab,      setTab]      = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [options,  setOptions]  = useState({ categories: [], sources: [] })

  const [hoveredId,  setHoveredId]  = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [showLogModal, setShowLogModal] = useState(false)

  async function fetchItems() {
    setLoading(true)
    try {
      const res  = await fetch('/api/finance/recurring')
      const json = await res.json()
      if (json.success) setItems(json.data)
    } finally { setLoading(false) }
  }

  async function fetchOptions() {
    try {
      const res  = await fetch('/api/finance/categories')
      const json = await res.json()
      if (json.success) setOptions(json.data)
    } catch {}
  }

  useEffect(() => { fetchItems(); fetchOptions() }, [])

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      const res  = await fetch(`/api/finance/recurring/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) { alert(`Delete failed: ${err.message}`) }
    finally { setDeletingId(null) }
  }

  // ── Summary calculations ─────────────────────────────────────────
  const isMonthly = i => i.frequency === 'Monthly' || !i.frequency
  const isYrl     = i => i.frequency === 'Yearly'  || i.frequency === 'Annual'

  const monthlyIncome   = items.filter(i => isMonthly(i) && i.direction === 'Income'  && i.amount != null).reduce((s, i) => s + i.amount, 0)
  const monthlyExpenses = items.filter(i => isMonthly(i) && i.direction !== 'Income'  && i.amount != null).reduce((s, i) => s + i.amount, 0)
  const monthlyNet      = monthlyIncome - monthlyExpenses
  const yearlyTotal     = items.filter(i => isYrl(i) && i.amount != null).reduce((s, i) => s + i.amount, 0)
  const yearlyMonthlyEq = yearlyTotal / 12

  // ── Filter + group ────────────────────────────────────────────────
  const visibleItems = items.filter(item => {
    if (tab === 'Income')  return item.direction === 'Income'
    if (tab === 'Expense') return item.direction === 'Expense' || item.direction === null
    return true
  })
  const visibleMonthly     = visibleItems.filter(isMonthly)
  const visibleYearly      = visibleItems.filter(isYrl)
  const showSectionHeaders = visibleMonthly.length > 0 && visibleYearly.length > 0

  return (
    <div className="ds-page">

      {/* ── Header ── */}
      <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="ds-heading" style={{ fontSize: 'var(--text-xl)' }}>Recurring</h1>
        <div className="ds-row ds-gap-2">
          <button
            className="ds-btn ds-btn--outline ds-btn--sm"
            onClick={() => setShowLogModal(true)}
            disabled={visibleItems.length === 0}
          >
            Log items
          </button>
          <button className="ds-btn ds-btn--primary" onClick={() => setShowModal(true)}>
            + Add
          </button>
        </div>
      </div>

      {/* ── Hero summary card ── */}
      {!loading && items.length > 0 && (
        <div style={{
          background: 'var(--amber-light)', border: '1.5px solid var(--amber)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', marginBottom: 20,
        }}>
          <p className="ds-label" style={{ color: '#7a5000', marginBottom: 'var(--space-2)' }}>
            Monthly recurring
          </p>
          <p style={{
            fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
            color: 'var(--text-primary)', marginBottom: 'var(--space-3)',
          }}>
            −${monthlyExpenses.toFixed(2)}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: yearlyTotal > 0 ? 12 : 0 }}>
            {monthlyIncome > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.6)', border: '1.5px solid var(--green)',
                borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700,
                color: '#1e5c1b', padding: '3px 10px',
              }}>↑ ${monthlyIncome.toFixed(2)} in</span>
            )}
            {monthlyExpenses > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.6)', border: '1.5px solid var(--coral)',
                borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700,
                color: '#9a2a1a', padding: '3px 10px',
              }}>↓ ${monthlyExpenses.toFixed(2)} out</span>
            )}
            {monthlyNet !== 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.6)',
                border: `1.5px solid ${monthlyNet >= 0 ? 'var(--green)' : 'var(--coral)'}`,
                borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700,
                color: monthlyNet >= 0 ? '#1e5c1b' : '#9a2a1a', padding: '3px 10px',
              }}>{monthlyNet >= 0 ? '+' : ''}${monthlyNet.toFixed(2)} net</span>
            )}
          </div>
          {yearlyTotal > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)',
              padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#7a5000' }}>
                Yearly commitments
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ${yearlyTotal.toFixed(0)}/yr
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: '#7a5000' }}>
                  ≈ ${yearlyMonthlyEq.toFixed(0)}/mo
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div className="ds-row ds-gap-2">
          {['All', 'Income', 'Expense'].map(t => (
            <button key={t}
              className={`ds-chip${tab === t ? (t === 'Income' ? ' ds-chip--green-active' : t === 'Expense' ? ' ds-chip--coral-active' : ' ds-chip--active') : ''}`}
              onClick={() => setTab(t)}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 48 }}>Loading…</p>
      ) : visibleItems.length === 0 ? (
        <div className="ds-card ds-card--padded ds-card--dashed" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No recurring items yet.</p>
        </div>
      ) : (
        <div className="ds-card">

          {visibleMonthly.length > 0 && (
            <>
              {showSectionHeaders && <SectionHeader label="Monthly" count={visibleMonthly.length} />}
              {visibleMonthly.map((item, i) => {
                const isLast = i === visibleMonthly.length - 1 && visibleYearly.length === 0
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px',
                      borderBottom: !isLast ? '1px solid var(--border)' : 'none',
                      background: 'transparent',
                    }}
                  >
                    <DirectionDot direction={item.direction} />
                    <div className="ds-col ds-flex-1" style={{ gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                      {(item.category || item.notes) && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[item.category, item.notes].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: 'var(--text-sm)', minWidth: 60, textAlign: 'right', flexShrink: 0,
                      color: item.direction === 'Income' ? 'var(--green)' : item.direction === 'Expense' ? 'var(--coral)' : 'var(--text-secondary)',
                    }}>{fmtAmount(item.amount)}</span>
                    <PeriodPill activeFrom={item.activeFrom} activeUntil={item.activeUntil} />
                    <FrequencyPill frequency={item.frequency} />
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      disabled={deletingId === item.id}
                      style={{
                        flexShrink: 0, background: 'none', border: 'none',
                        cursor: deletingId === item.id ? 'wait' : 'pointer',
                        padding: '2px 4px', borderRadius: 'var(--radius-sm)',
                        color: 'var(--coral)', fontSize: 13, lineHeight: 1,
                        opacity: hoveredId === item.id ? 1 : 0,
                        transition: 'opacity 120ms var(--ease)',
                        pointerEvents: hoveredId === item.id ? 'auto' : 'none',
                      }}
                      aria-label="Delete"
                    >{deletingId === item.id ? '…' : '✕'}</button>
                  </div>
                )
              })}
            </>
          )}

          {visibleYearly.length > 0 && (
            <>
              <SectionHeader
                label="Yearly"
                count={visibleYearly.length}
                extra={yearlyTotal > 0 ? `$${yearlyTotal.toFixed(0)} total` : null}
              />
              {visibleYearly.map((item, i) => {
                const isLast    = i === visibleYearly.length - 1
                const monthLabel = item.yearlyMonth ? MONTH_NAMES[item.yearlyMonth - 1]?.slice(0, 3) : null
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px',
                      borderBottom: !isLast ? '1px solid var(--border)' : 'none',
                      background: 'transparent',
                    }}
                  >
                    <DirectionDot direction={item.direction} />
                    <div className="ds-col ds-flex-1" style={{ gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                      {(monthLabel || item.category || item.notes) && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[monthLabel, item.category, item.notes].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: 'var(--text-sm)', minWidth: 60, textAlign: 'right', flexShrink: 0,
                      color: item.direction === 'Income' ? 'var(--green)' : item.direction === 'Expense' ? 'var(--coral)' : 'var(--text-secondary)',
                    }}>{fmtAmount(item.amount)}</span>
                    <PeriodPill activeFrom={item.activeFrom} activeUntil={item.activeUntil} />
                    <FrequencyPill frequency={item.frequency} />
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      disabled={deletingId === item.id}
                      style={{
                        flexShrink: 0, background: 'none', border: 'none',
                        cursor: deletingId === item.id ? 'wait' : 'pointer',
                        padding: '2px 4px', borderRadius: 'var(--radius-sm)',
                        color: 'var(--coral)', fontSize: 13, lineHeight: 1,
                        opacity: hoveredId === item.id ? 1 : 0,
                        transition: 'opacity 120ms var(--ease)',
                        pointerEvents: hoveredId === item.id ? 'auto' : 'none',
                      }}
                      aria-label="Delete"
                    >{deletingId === item.id ? '…' : '✕'}</button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* ── Add recurring modal ── */}
      {showModal && (
        <AddRecurringModal
          categories={options.categories}
          sources={options.sources}
          onClose={() => setShowModal(false)}
          onSaved={item => {
            setItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)))
            setShowModal(false)
          }}
        />
      )}

      {showLogModal && (
        <LogRecurringModal
          items={visibleItems}
          onClose={() => setShowLogModal(false)}
          onDone={() => {
            fetchItems()
            setShowLogModal(false)
          }}
        />
      )}
    </div>
  )
}
