import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function fmtMoney(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const STATUS_PRIORITY = { Repaying: 0, Active: 1, Funded: 2, Spending: 3 }

function isLiabilityAccount(account) {
  if (account.role) return account.role === 'liability'
  const value = `${account.name ?? ''} ${account.type ?? ''}`.toLowerCase()
  return /credit card|card|loan|debt|mortgage|liability/.test(value)
}

function isCashAccount(account) {
  const value = `${account.name ?? ''} ${account.type ?? ''}`.toLowerCase()
  return /checking|savings|cash/.test(value)
}

// ── Circular progress ring ────────────────────────────────────────
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

// ── Section card ──────────────────────────────────────────────────
function Section({ title, linkTo, linkLabel, children }) {
  return (
    <div className="ds-card ds-card--padded">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{
          margin: 0,
          fontSize: 'var(--text-xs)', fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          {title}
        </p>
        {linkTo && (
          <Link to={linkTo} style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textDecoration: 'none' }}>
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

export default function FinanceOverview() {
  const navigate = useNavigate()
  const month = toMonthKey(new Date())
  const today = new Date()
  const [y, m] = month.split('-').map(Number)

  const [accounts,      setAccounts]      = useState([])
  const [cpf,           setCpf]           = useState(null)
  const [budgetSummary, setBudgetSummary] = useState([])
  const [income,        setIncome]        = useState(0)
  const [buckets,       setBuckets]       = useState([])
  const [paybackTotal,  setPaybackTotal]  = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [showSavingsEditor, setShowSavingsEditor] = useState(false)
  const [balanceInputs,     setBalanceInputs]     = useState({})
  const [savingId,          setSavingId]          = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [r1, r2, r3, r4, r5] = await Promise.all([
          fetch('/api/finance/accounts'),
          fetch('/api/finance/cpf/latest'),
          fetch(`/api/finance/budgets/summary?month=${month}`),
          fetch('/api/finance/buckets'),
          fetch('/api/finance/payback'),
        ])
        const [a, c, b, bk, pb] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json(), r5.json()])
        if (cancelled) return
        if (a.success)  setAccounts(a.data)
        if (c.success)  setCpf(c.data)
        if (b.success)  { setBudgetSummary(b.data); setIncome(b.income ?? 0) }
        if (bk.success) setBuckets(bk.data)
        if (pb.success) setPaybackTotal(pb.data.reduce((s, i) => s + i.remaining, 0))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleSaveBalance(id) {
    const val = parseFloat(balanceInputs[id])
    if (isNaN(val)) return
    setSavingId(id)
    try {
      const res  = await fetch(`/api/finance/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: val }),
      })
      const json = await res.json()
      if (json.success) setAccounts(prev => prev.map(a => a.id === id ? json.data : a))
    } finally { setSavingId(null) }
  }

  // ── Derived values ─────────────────────────────────────────────
  const assetAccounts     = accounts.filter(a => !isLiabilityAccount(a))
  const liabilityAccounts = accounts.filter(a => isLiabilityAccount(a))
  const assetTotal        = assetAccounts.reduce((s, a) => s + a.balance, 0)
  const liabilityTotal    = liabilityAccounts.reduce((s, a) => s + a.balance, 0)
  const cashTotal         = assetTotal   // all non-liability accounts
  const savingsAccounts   = assetAccounts
  const cpfTotal         = cpf ? (cpf.oa + cpf.sa + cpf.ma) : 0
  const netWorth         = assetTotal - liabilityTotal + cpfTotal - paybackTotal

  const totalLimit   = budgetSummary.reduce((s, b) => s + b.monthlyLimit, 0)
  const totalSpent   = budgetSummary.reduce((s, b) => s + b.spent, 0)
  const totalPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const net          = income - totalSpent
  const spendStatus  = totalSpent > totalLimit ? 'over' : totalPercent >= 80 ? 'warning' : 'ok'

  const daysInMonth = new Date(y, m, 0).getDate()
  const daysLeft    = daysInMonth - today.getDate()

  const alerts = []
  for (const b of budgetSummary) {
    if (b.monthlyLimit === 0) continue
    if (b.status === 'over')
      alerts.push({ type: 'over', msg: `${b.category} over budget — ${fmtMoney(b.spent)} of ${fmtMoney(b.monthlyLimit)}` })
    else if (b.status === 'warning')
      alerts.push({ type: 'warning', msg: `${b.category} at ${Math.round(b.percentUsed)}% · ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` })
  }
  alerts.sort((a, b) => (a.type === 'over' ? -1 : 1))
  const topAlerts = alerts.slice(0, 3)

  const topBuckets = [...buckets]
    .filter(b => ['Active', 'Repaying', 'Funded'].includes(b.status))
    .sort((a, b) => {
      const pd = (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9)
      return pd !== 0 ? pd : b.percentFunded - a.percentFunded
    })
    .slice(0, 4)

  const bucketSavingsTotal = buckets
    .filter(b => ['Active', 'Repaying', 'Funded'].includes(b.status))
    .reduce((sum, bucket) => sum + bucket.currentAmount, 0)
  const bucketSavingsCount = buckets.filter(b => ['Active', 'Repaying', 'Funded'].includes(b.status)).length

  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('en-SG', { month: 'long' })

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="ds-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="ds-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 className="ds-heading" style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Finance</h1>
        <button
          onClick={() => navigate('/finance/review')}
          className="ds-btn ds-btn--green ds-btn--sm"
        >
          ✓ Start review
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <div className="ds-card ds-card--padded" style={{ background: 'var(--green-light)', borderColor: 'var(--green)' }}>
          <p className="ds-label" style={{ color: '#1e5c1b', marginBottom: 10 }}>Net worth</p>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
              {fmtMoney(netWorth)}
            </span>
          </div>
        </div>

        <div className="ds-card ds-card--padded" style={{ background: 'var(--lavender-light)', borderColor: 'var(--lavender)' }}>
          <p className="ds-label" style={{ color: '#5B3D7A', marginBottom: 10 }}>Savings</p>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
              {fmtMoney(cashTotal)}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: '#5B3D7A', fontWeight: 600 }}>
            Bank balances you can spend
          </p>
          <button
            className="ds-btn ds-btn--outline ds-btn--sm"
            onClick={() => {
              const init = {}
              assetAccounts.forEach(a => { init[a.id] = String(a.balance) })
              setBalanceInputs(init)
              setShowSavingsEditor(true)
            }}
            style={{ marginTop: 12 }}
          >
            Update balances
          </button>
        </div>

        <div className="ds-card ds-card--padded" style={{ background: 'var(--sky-light)', borderColor: 'var(--sky)' }}>
          <p className="ds-label" style={{ color: '#35597B', marginBottom: 10 }}>CPF</p>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
              {fmtMoney(cpfTotal)}
            </span>
          </div>
        </div>

        {paybackTotal > 0 && (
          <div
            className="ds-card ds-card--padded ds-card--clickable"
            onClick={() => navigate('/finance/payback')}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate('/finance/payback')}
            style={{ background: 'var(--coral-light)', borderColor: 'var(--coral)' }}
          >
            <p className="ds-label" style={{ color: '#9a2a1a', marginBottom: 10 }}>Payback queue</p>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
                {fmtMoney(paybackTotal)}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: '#9a2a1a', fontWeight: 600 }}>
              Deducted from net worth
            </p>
          </div>
        )}
      </div>

      {/* ── ALERTS ── */}
      {topAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {topAlerts.map((alert, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              background: alert.type === 'over' ? 'var(--coral-light)' : 'var(--amber-light)',
              border: `1.5px solid ${alert.type === 'over' ? 'var(--coral)' : 'var(--amber)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              color: alert.type === 'over' ? '#9a2a1a' : '#7a5000',
            }}>
              {alert.type === 'over' ? '✕' : '⚠'} {alert.msg}
            </div>
          ))}
        </div>
      )}

      {/* ── Budget card ── */}
      {(budgetSummary.length > 0 || totalLimit > 0) && (
        <div
          className="ds-card ds-card--padded ds-card--clickable"
          onClick={() => navigate('/finance/ledger')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/finance/ledger')}
          style={{ display: 'flex', alignItems: 'center', gap: 16 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', flex: 1 }}>
                Budget · {monthLabel}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>›</span>
            </div>
            {totalLimit > 0 && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {fmtMoney(totalSpent)} spent · {fmtMoney(Math.max(totalLimit - totalSpent, 0))} left
              </span>
            )}
          </div>
          {totalLimit > 0 && (
            <CircularRing
              percent={totalPercent}
              size={64}
              stroke={6}
              color={spendStatus === 'over' ? 'var(--coral)' : spendStatus === 'warning' ? 'var(--amber)' : 'var(--green)'}
              label={`${Math.round(totalPercent)}%`}
            />
          )}
        </div>
      )}

      {/* ── SAVINGS BUCKETS ── */}
      {topBuckets.length > 0 && (
        <Section title="Savings buckets" linkTo="/finance/ledger" linkLabel="View all →">
          <p style={{ margin: '0 0 12px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            {bucketSavingsCount} active goal{bucketSavingsCount === 1 ? '' : 's'} · {fmtMoney(bucketSavingsTotal)} allocated
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topBuckets.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CircularRing
                  percent={b.percentFunded}
                  size={42}
                  stroke={4}
                  color={b.status === 'Repaying' ? 'var(--coral)' : b.percentFunded >= 100 ? 'var(--green)' : 'var(--lavender)'}
                  label={`${Math.round(b.percentFunded)}%`}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {b.name}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>
                      {fmtMoney(b.currentAmount)} / {fmtMoney(b.targetAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {showSavingsEditor && (
        <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowSavingsEditor(false) }}>
          <div className="ds-modal" style={{ maxWidth: 480 }}>
            <div className="ds-modal__header">
              <div>
                <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>Update balances</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Edit the balance for each account, then save.
                </p>
              </div>
              <button className="ds-modal__close" onClick={() => setShowSavingsEditor(false)} aria-label="Close">✕</button>
            </div>
            <div className="ds-modal__body">
              {savingsAccounts.length === 0 ? (
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  No accounts found. Add accounts to your Notion Accounts database first.
                </p>
              ) : savingsAccounts.map(account => (
                <div key={account.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{account.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{account.type || 'Account'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>$</span>
                    <input
                      className="ds-input"
                      type="number" step="0.01" min="0"
                      value={balanceInputs[account.id] ?? ''}
                      onChange={e => setBalanceInputs(prev => ({ ...prev, [account.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleSaveBalance(account.id)}
                      style={{ width: 120 }}
                    />
                    <button
                      className="ds-btn ds-btn--primary ds-btn--sm"
                      onClick={() => handleSaveBalance(account.id)}
                      disabled={savingId === account.id}
                    >
                      {savingId === account.id ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="ds-modal__footer">
              <button className="ds-btn ds-btn--ghost" onClick={() => setShowSavingsEditor(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
