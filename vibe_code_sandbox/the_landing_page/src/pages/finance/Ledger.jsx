import { useEffect, useState } from 'react'
import AddTransactionModal from './AddTransactionModal.jsx'
import BucketsSection from './BucketsSection.jsx'
import BigSpendModal from './BigSpendModal.jsx'
import RecordCardPaymentModal from './RecordCardPaymentModal.jsx'

const PILL_COLORS = {
  gray:    { bg: '#F0EBE3', text: '#78716C' },
  brown:   { bg: '#F5EDE8', text: '#7A4A35' },
  orange:  { bg: '#FDF0D0', text: '#8A5F00' },
  yellow:  { bg: '#FDF0D0', text: '#8A5F00' },
  green:   { bg: '#D6EDCF', text: '#1E5C1B' },
  blue:    { bg: '#DDF0F8', text: '#1A5C8A' },
  purple:  { bg: '#EDE5F5', text: '#5B3D7A' },
  pink:    { bg: '#FCE8F3', text: '#8A2C62' },
  red:     { bg: '#FAD9D5', text: '#9A2A1A' },
  default: { bg: '#F0EBE3', text: '#78716C' },
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthKey) {
  const [year, mon] = monthKey.split('-').map(Number)
  return new Date(year, mon - 1, 1).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })
}

function shiftMonth(monthKey, delta) {
  const [year, mon] = monthKey.split('-').map(Number)
  const d = new Date(year, mon - 1 + delta, 1)
  return toMonthKey(d)
}

function fmtMoney(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function groupByDate(transactions) {
  const groups = {}
  for (const t of transactions) {
    const key = t.date ?? 'Unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  return Object.entries(groups).sort(([a], [b]) => (a < b ? 1 : -1))
}

function formatDateHeading(dateStr) {
  if (!dateStr || dateStr === 'Unknown') return 'Unknown'
  const [year, mon, day] = dateStr.split('-').map(Number)
  return new Date(year, mon - 1, day).toLocaleDateString('en-SG', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function shortCategory(cat) {
  if (!cat) return ''
  const short = { 'Bills & Subscriptions': 'Bills', 'Gifts & Celebrations': 'Gifts', 'Pending Matcha': 'Matcha' }
  return short[cat] ?? cat
}

function CategoryPill({ category, color }) {
  if (!category) return null
  const c = PILL_COLORS[color] ?? PILL_COLORS.default
  return (
    <span style={{
      background: c.bg, color: c.text,
      borderRadius: 999, padding: '2px 9px',
      fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {category}
    </span>
  )
}

const OPTS_CACHE_KEY = 'life-os:options'

function CircularRing({ percent, size = 44, stroke = 5, color = 'var(--green)', label }) {
  const pct = Math.min(Math.max(percent, 0), 100)
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      {label !== undefined && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size < 48 ? 9 : 11, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em',
        }}>
          {label}
        </div>
      )}
    </div>
  )
}

function isLiabilityAccount(account) {
  if (account.role) return account.role === 'liability'
  const value = `${account.name ?? ''} ${account.type ?? ''}`.toLowerCase()
  return /credit card|card|loan|debt|mortgage|liability/.test(value)
}

function isCashAccount(account) {
  const value = `${account.name ?? ''} ${account.type ?? ''}`.toLowerCase()
  return /checking|savings|cash/.test(value)
}

function readCache() {
  try {
    const raw = localStorage.getItem(OPTS_CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > 60 * 1000) return null   // 1-minute seed cache — revalidate always fires on open
    return data
  } catch { return null }
}

function writeCache(data) {
  try { localStorage.setItem(OPTS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

export default function Ledger() {
  const [month, setMonth]               = useState(toMonthKey(new Date()))
  const [allTransactions, setAllTransactions] = useState([])
  const [loading, setLoading]           = useState(false)
  const [filter, setFilter]             = useState('All')
  const [showModal, setShowModal]       = useState(false)
  const [hoveredId, setHoveredId]       = useState(null)
  const [deletingId, setDeletingId]     = useState(null)

  const [accounts, setAccounts]         = useState([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Budget state
  const [budgetSummary, setBudgetSummary]   = useState([])
  const [budgetTotalExpenses, setBudgetTotalExpenses] = useState(null) // server-side tally
  const [budgetsLoading, setBudgetsLoading] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetsEdit, setBudgetsEdit]       = useState(false)
  const [editLimits, setEditLimits]         = useState({})
  const [savingBudgets, setSavingBudgets]   = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState(() => new Set())

  // Buckets state
  const [buckets, setBuckets]           = useState([])
  const [bucketsLoading, setBucketsLoading] = useState(false)
  const [bigSpend, setBigSpend]         = useState(null) // { bucketId, bucketName, shortfall }

  async function fetchBuckets(showCompleted = false) {
    setBucketsLoading(true)
    try {
      const res  = await fetch(`/api/finance/buckets${showCompleted ? '?showCompleted=true' : ''}`)
      const json = await res.json()
      if (json.success) setBuckets(json.data)
    } finally { setBucketsLoading(false) }
  }

  // Options state — seeded from cache so the modal opens instantly
  const [options, setOptions] = useState(
    () => readCache() ?? { categories: [], sources: [] }
  )
  const { categories, sources } = options

  function patchOptions(key, updater) {
    setOptions(prev => {
      const next = { ...prev, [key]: updater(prev[key]) }
      writeCache(next)
      return next
    })
  }

  async function fetchTransactions(m) {
    setLoading(true)
    try {
      const res  = await fetch(`/api/finance/transactions?month=${m}`)
      const json = await res.json()
      if (json.success) setAllTransactions(json.data)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAccounts() {
    setAccountsLoading(true)
    try {
      const res = await fetch('/api/finance/accounts')
      const json = await res.json()
      if (json.success) setAccounts(json.data)
    } finally {
      setAccountsLoading(false)
    }
  }

  async function revalidateOptions() {
    try {
      const res  = await fetch('/api/finance/categories')
      const json = await res.json()
      if (json.success) { setOptions(json.data); writeCache(json.data) }
    } catch {}
  }

  async function fetchBudgetSummary(m) {
    setBudgetsLoading(true)
    try {
      const res  = await fetch(`/api/finance/budgets/summary?month=${m}`)
      const json = await res.json()
      if (json.success) {
        setBudgetSummary(json.data)
        if (json.totalExpenses != null) setBudgetTotalExpenses(json.totalExpenses)
      }
    } finally {
      setBudgetsLoading(false)
    }
  }

  function enterEditMode() {
    const limits = {}
    for (const b of budgetSummary) {
      if (b.id === '__uncategorized__') continue
      limits[b.id] = String(b.monthlyLimit)
    }
    setEditLimits(limits)
    setBudgetsEdit(true)
  }

  async function handleSaveBudgets() {
    setSavingBudgets(true)
    try {
      const changed = Object.entries(editLimits).filter(([id, val]) => {
        const orig = budgetSummary.find(b => b.id === id)?.monthlyLimit
        return orig !== (parseFloat(val) || 0)
      })
      await Promise.all(changed.map(([id, val]) =>
        fetch(`/api/finance/budgets/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthlyLimit: parseFloat(val) || 0 }),
        })
      ))
      setBudgetsEdit(false)
      await fetchBudgetSummary(month)
    } catch (err) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSavingBudgets(false)
    }
  }

  function closeBudgetModal() {
    setBudgetsEdit(false)
    setShowBudgetModal(false)
  }

  useEffect(() => { fetchTransactions(month) }, [month])
  useEffect(() => { revalidateOptions() }, [])
  useEffect(() => { fetchBudgetSummary(month) }, [month])
  useEffect(() => { fetchBuckets() }, [])
  useEffect(() => { fetchAccounts() }, [])

  async function handleTransactionSaved(tx, bucketId) {
    setAllTransactions(prev => [tx, ...prev])
    fetchBudgetSummary(month)
    if (bucketId) {
      try {
        const res  = await fetch(`/api/finance/buckets/${bucketId}/spend`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: tx.amount }),
        })
        const json = await res.json()
        if (json.success) {
          fetchBuckets()
          if (json.data.shortfall > 0) {
            setBigSpend({ bucketId, bucketName: json.data.bucket.name, shortfall: json.data.shortfall })
          }
        }
      } catch {}
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      const res  = await fetch(`/api/finance/transactions/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAllTransactions(prev => prev.filter(t => t.id !== id))
      fetchBudgetSummary(month)
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  function changeMonth(delta) {
    setMonth(m => shiftMonth(m, delta))
    setFilter('All')
  }

  async function handlePaymentSaved() {
    setShowPaymentModal(false)
    await fetchAccounts()
  }

  const income   = allTransactions.filter(t => t.direction === 'Income').reduce((s, t) => s + t.amount, 0)
  const expenses = allTransactions.filter(t => t.direction === 'Expense' && !t.isBucketSpend).reduce((s, t) => s + t.amount, 0)
  const net      = income - expenses

  const assetAccounts = accounts.filter(a => !isLiabilityAccount(a))
  const cashAccounts = assetAccounts.filter(isCashAccount)
  const liabilityAccounts = accounts.filter(isLiabilityAccount)
  const assetTotal = assetAccounts.reduce((s, a) => s + a.balance, 0)
  const cashTotal = cashAccounts.reduce((s, a) => s + a.balance, 0)
  const liabilityTotal = liabilityAccounts.reduce((s, a) => s + a.balance, 0)
  const netWorth = assetTotal - liabilityTotal

  // ── Budget computed values ──────────────────────────────────────────────────
  const activeBudgets = budgetSummary.filter(b => b.monthlyLimit > 0)
  const totalBudget   = activeBudgets.reduce((s, b) => s + b.monthlyLimit, 0)
  const totalSpent    = budgetSummary.reduce((s, b) => s + b.spent, 0)
  const totalPercent  = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const totalStatus   = totalSpent > totalBudget ? 'over' : totalPercent >= 80 ? 'warning' : 'ok'

  const today          = new Date()
  const isCurrentMonth = month === toMonthKey(today)
  const [_y, _m]       = month.split('-').map(Number)
  const daysInMonth    = new Date(_y, _m, 0).getDate()
  const daysLeft       = isCurrentMonth ? daysInMonth - today.getDate() : 0

  const rawAlerts = []
  if (isCurrentMonth) {
    for (const b of budgetSummary) {
      if (b.monthlyLimit === 0) continue
      if (b.status === 'over') {
        rawAlerts.push({ key: `over-${b.category}`, type: 'over',
          msg: `${b.category} over budget — $${b.spent.toFixed(0)} of $${b.monthlyLimit.toFixed(0)}` })
      } else if (b.status === 'warning') {
        rawAlerts.push({ key: `warn-${b.category}`, type: 'warning',
          msg: `${b.category} at ${Math.round(b.percentUsed)}% with ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` })
      }
    }
  }
  const visibleAlerts = rawAlerts.filter(a => !dismissedAlerts.has(a.key))

  const visible = allTransactions.filter(t => {
    if (filter === 'Income')       return t.direction === 'Income'
    if (filter === 'Expense')      return t.direction === 'Expense'
    if (filter === 'Needs Review') return t.needsReview
    return true
  })

  const grouped = groupByDate(visible)

  return (
    <div className="ds-page">

      <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <h1 className="ds-heading" style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Ledger</h1>
        <div className="ds-row ds-gap-2">
          <button
            className="ds-btn ds-btn--outline ds-btn--sm"
            onClick={() => setShowPaymentModal(true)}
            disabled={accountsLoading || cashAccounts.length === 0 || liabilityAccounts.length === 0}
          >
            Record card payment
          </button>
          <button className="ds-btn ds-btn--primary" onClick={() => { revalidateOptions(); setShowModal(true) }}>+ Add</button>
        </div>
      </div>

      {/* ── Month nav ── */}
      <div className="ds-row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 16, justifyContent: 'space-between' }}>
        <div className="ds-row ds-gap-2">
          <button className="ds-btn ds-btn--icon" onClick={() => changeMonth(-1)}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', minWidth: 120, textAlign: 'center' }}>
            {formatMonthLabel(month)}
          </span>
          <button className="ds-btn ds-btn--icon" onClick={() => changeMonth(1)}>›</button>
        </div>
      </div>

      <div style={{
        background: net >= 0 ? 'var(--green-light)' : 'var(--coral-light)',
        border: `1.5px solid ${net >= 0 ? 'var(--green)' : 'var(--coral)'}`,
        borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', marginBottom: 24,
      }}>
        <p className="ds-label" style={{ color: net >= 0 ? '#1e5c1b' : '#9a2a1a', marginBottom: 'var(--space-2)' }}>
          Net · {formatMonthLabel(month)}
        </p>
        <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: net >= 0 ? '#1e5c1b' : '#9a2a1a', marginBottom: 'var(--space-3)' }}>
          {net >= 0 ? '+' : ''}${net.toFixed(2)}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.6)', border: '1.5px solid var(--green)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700, color: '#1e5c1b', padding: '4px 12px' }}>
            ↑ ${income.toFixed(2)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.6)', border: '1.5px solid var(--coral)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700, color: '#9a2a1a', padding: '4px 12px' }}>
            ↓ ${expenses.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── Month overview modal ── */}
      {showBudgetModal && (
        <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeBudgetModal() }}>
          <div className="ds-modal">
            <div className="ds-modal__header">
              <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>
                Month overview · {formatMonthLabel(month)}
              </h2>
              <button className="ds-modal__close" onClick={closeBudgetModal} aria-label="Close">✕</button>
            </div>

            <div className="ds-modal__body" style={{ gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <p className="ds-label" style={{ color: '#1e5c1b', marginBottom: 6 }}>Income</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800 }}>{income.toFixed(0)}</p>
                </div>
                <div style={{ background: 'var(--coral-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <p className="ds-label" style={{ color: '#9a2a1a', marginBottom: 6 }}>Spent</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800 }}>{expenses.toFixed(0)}</p>
                </div>
                <div style={{ background: 'var(--lavender-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <p className="ds-label" style={{ color: '#5B3D7A', marginBottom: 6 }}>Net worth</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800 }}>{netWorth.toFixed(0)}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="ds-badge ds-badge--green">Cash {fmtMoney(cashTotal)}</span>
                <span className="ds-badge ds-badge--coral">Card debt {fmtMoney(liabilityTotal)}</span>
                <span className="ds-badge ds-badge--neutral">{allTransactions.length} entries</span>
              </div>

              <div style={{ background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="ds-label">Budgets</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    {totalBudget > 0 ? `${totalSpent.toFixed(0)} / ${totalBudget.toFixed(0)}` : 'No budget set'}
                  </span>
                </div>
                {budgetSummary.map((b, i) => {
                  const isUncategorized = b.id === '__uncategorized__'
                  return (
                    <div
                      key={b.id}
                      style={{
                        padding: '12px 0',
                        borderBottom: i < budgetSummary.length - 1 ? '1px solid rgba(28,25,23,0.08)' : 'none',
                        ...(isUncategorized ? {
                          background: 'var(--amber-light)',
                          margin: '8px -16px -4px',
                          padding: '10px 16px',
                          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                        } : {}),
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: (budgetsEdit || isUncategorized) ? 0 : 8 }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: isUncategorized ? '#7a5000' : 'var(--text-primary)' }}>
                          {b.category}
                          {isUncategorized && <span style={{ fontWeight: 400, fontSize: 'var(--text-xs)', marginLeft: 6 }}>— no budget row matched</span>}
                        </span>
                        {!isUncategorized && budgetsEdit ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>$</span>
                            <input
                              type="number" min="0" step="0.01"
                              value={editLimits[b.id] ?? ''}
                              onChange={e => setEditLimits(prev => ({ ...prev, [b.id]: e.target.value }))}
                              style={{
                                width: 80, padding: '4px 8px',
                                fontSize: 'var(--text-sm)', fontWeight: 600,
                                background: 'var(--bg-sunken)', border: '1.5px solid var(--border)',
                                borderRadius: 'var(--radius-sm)', outline: 'none',
                                color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
                              }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: isUncategorized ? '#7a5000' : 'var(--text-secondary)', fontWeight: 600 }}>
                            ${b.spent.toFixed(0)}{!isUncategorized && ` / $${b.monthlyLimit.toFixed(0)}`}
                          </span>
                        )}
                      </div>
                      {!budgetsEdit && !isUncategorized && (
                        <div style={{ background: 'var(--bg-surface)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 999, transition: 'width 300ms ease',
                            width: `${Math.min(b.percentUsed, 100)}%`,
                            background: b.status === 'over' ? 'var(--coral)' : b.status === 'warning' ? 'var(--amber)' : b.status === 'zero' ? 'var(--border)' : 'var(--green)',
                          }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Reconciliation strip */}
              {budgetTotalExpenses != null && !budgetsEdit && (
                <div style={{
                  marginTop: 12, padding: '10px 14px',
                  background: Math.abs(budgetTotalExpenses - expenses) < 0.5 ? 'var(--green-light)' : 'var(--amber-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)', fontWeight: 600,
                  color: Math.abs(budgetTotalExpenses - expenses) < 0.5 ? '#1e5c1b' : '#7a5000',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>Ledger expenses</span>
                  <span>${expenses.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="ds-modal__footer">
              {budgetsEdit ? (
                <>
                  <button className="ds-btn ds-btn--ghost" onClick={() => setBudgetsEdit(false)}>Cancel</button>
                  <button className="ds-btn ds-btn--primary" onClick={handleSaveBudgets} disabled={savingBudgets}>
                    {savingBudgets ? 'Saving…' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button className="ds-btn ds-btn--ghost" onClick={closeBudgetModal}>Close</button>
                  <button className="ds-btn ds-btn--outline" onClick={enterEditMode}>Edit Limits</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Buckets section ── */}
      <BucketsSection
        buckets={buckets}
        loading={bucketsLoading}
        onRefresh={fetchBuckets}
        categories={categories}
      />

      {/* ── Budget card ── */}
      {(budgetSummary.length > 0 || budgetsLoading) && (
        <div
          className={`ds-card ds-card--padded${budgetsLoading ? '' : ' ds-card--clickable'}`}
          onClick={() => !budgetsLoading && setShowBudgetModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && !budgetsLoading && setShowBudgetModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', flex: 1 }}>
                Budget · {formatMonthLabel(month)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>›</span>
            </div>
            {totalBudget > 0 && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                ${totalSpent.toFixed(0)} spent · ${Math.max(totalBudget - totalSpent, 0).toFixed(0)} left
              </span>
            )}
          </div>
          {totalBudget > 0 && (
            <CircularRing
              percent={totalPercent}
              size={64}
              stroke={6}
              color={totalStatus === 'over' ? 'var(--coral)' : totalStatus === 'warning' ? 'var(--amber)' : 'var(--green)'}
              label={`${Math.round(totalPercent)}%`}
            />
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="ds-row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 16, justifyContent: 'space-between' }}>
        <div className="ds-row ds-gap-2" style={{ flexWrap: 'wrap' }}>
          {[
            { label: 'All',          active: 'ds-chip--active'      },
            { label: 'Income',       active: 'ds-chip--green-active' },
            { label: 'Expense',      active: 'ds-chip--coral-active' },
            { label: 'Needs Review', active: 'ds-chip--amber-active' },
          ].map(({ label, active }) => (
            <button
              key={label}
              className={`ds-chip${filter === label ? ` ${active}` : ''}`}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transaction list ── */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 48 }}>Loading…</p>
      ) : grouped.length === 0 ? (
        <div className="ds-card ds-card--padded ds-card--dashed" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No transactions found.</p>
        </div>
      ) : (
        <div className="ds-col" style={{ gap: 24 }}>
          {grouped.map(([dateKey, txns]) => (
            <div key={dateKey} className="ds-card">
              <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
                <span className="ds-label">{formatDateHeading(dateKey)}</span>
              </div>
              {txns.map((t, i) => (
                <div
                  key={t.id}
                  onMouseEnter={() => setHoveredId(t.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    minHeight: 48,
                    borderBottom: i < txns.length - 1 ? '1px solid #D0C8BE' : 'none',
                    opacity: t.isBucketSpend ? 0.55 : 1,
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: t.direction === 'Income' ? 'var(--green)' : t.isBucketSpend ? 'var(--lavender)' : 'var(--coral)',
                  }} />
                  <div className="ds-col ds-flex-1" style={{ gap: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', fontStyle: t.isBucketSpend ? 'italic' : 'normal' }}>
                      {t.title || '—'}
                    </span>
                    {t.merchant && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t.merchant}</span>
                    )}
                  </div>
                  <CategoryPill
                    category={t.isBucketSpend ? 'Bucket' : shortCategory(t.category)}
                    color={(categories.find(c => c.name === t.category) ?? {}).color}
                  />
                  <span style={{
                    fontWeight: 700, fontSize: 'var(--text-sm)',
                    minWidth: 76, textAlign: 'right', flexShrink: 0,
                    color: t.direction === 'Income' ? 'var(--green)' : 'var(--text-primary)',
                  }}>
                    {t.direction === 'Income' ? '+' : '−'}${t.amount.toFixed(2)}
                  </span>
                  {t.needsReview && <span className="ds-badge ds-badge--amber" style={{ flexShrink: 0 }}>Review</span>}
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    style={{
                      flexShrink: 0, background: 'none', border: 'none',
                      cursor: deletingId === t.id ? 'wait' : 'pointer',
                      padding: '2px 4px', borderRadius: 'var(--radius-sm)',
                      color: 'var(--coral)', fontSize: 13, lineHeight: 1,
                      opacity: hoveredId === t.id ? 1 : 0,
                      transition: 'opacity 120ms var(--ease)',
                      pointerEvents: hoveredId === t.id ? 'auto' : 'none',
                    }}
                    aria-label="Delete transaction"
                  >
                    {deletingId === t.id ? '…' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Alert banners ── */}
      {visibleAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {visibleAlerts.map(alert => (
            <div key={alert.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '16px',
              background: alert.type === 'over' ? 'var(--coral-light)' : 'var(--amber-light)',
              border: `1.5px solid ${alert.type === 'over' ? 'var(--coral)' : 'var(--amber)'}`,
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: alert.type === 'over' ? '#9a2a1a' : '#7a5000' }}>
                {alert.type === 'over' ? '✕' : '⚠'} {alert.msg}
              </span>
              <button
                onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.key]))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-tertiary)', flexShrink: 0, padding: '2px 4px' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Add transaction modal ── */}
      {showModal && (
        <AddTransactionModal
          categories={categories}
          sources={sources}
          buckets={buckets}
          onSourceAdded={opt  => patchOptions('sources', prev => [...prev, opt])}
          onSourceDeleted={name => patchOptions('sources', prev => prev.filter(o => o.name !== name))}
          onClose={() => setShowModal(false)}
          onSaved={handleTransactionSaved}
          onBulkSaved={() => { fetchTransactions(month); fetchBudgetSummary(month) }}
        />
      )}

      {showPaymentModal && (
        <RecordCardPaymentModal
          accounts={accounts}
          onClose={() => setShowPaymentModal(false)}
          onPaid={handlePaymentSaved}
        />
      )}

      {/* ── Big spend shortfall modal ── */}
      {bigSpend && (
        <BigSpendModal
          shortfall={bigSpend.shortfall}
          bucketId={bigSpend.bucketId}
          bucketName={bigSpend.bucketName}
          budgetCategories={budgetSummary.map(b => b.category)}
          onDone={() => { setBigSpend(null); fetchBuckets(); fetchBudgetSummary(month) }}
          onClose={() => setBigSpend(null)}
        />
      )}

    </div>
  )
}
