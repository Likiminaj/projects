import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CircularRing from '../../components/CircularRing.jsx'

function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function fmtMoney(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const STATUS_PRIORITY = { Repaying: 0, Active: 1, Funded: 2, Spending: 3 }

const CPF_MONTHLY_CONTRIB = { oa: 1495, sa: 390, ma: 520 }
const CPF_CONTRIBUTION_BASE = '2026-03'

function cpfMonthsBetween(fromYM, toYM) {
  const [fy, fm] = fromYM.split('-').map(Number)
  const [ty, tm] = toYM.split('-').map(Number)
  return (ty - fy) * 12 + (tm - fm)
}

function projectCpf(entry) {
  if (!entry) return null
  const now = new Date()
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (entry.month >= cur) return entry
  const base = entry.month > CPF_CONTRIBUTION_BASE ? entry.month : CPF_CONTRIBUTION_BASE
  const n = Math.max(0, cpfMonthsBetween(base, cur))
  const oa = entry.oa + CPF_MONTHLY_CONTRIB.oa * n
  const sa = entry.sa + CPF_MONTHLY_CONTRIB.sa * n
  const ma = entry.ma + CPF_MONTHLY_CONTRIB.ma * n
  return { ...entry, oa, sa, ma, total: oa + sa + ma }
}

function buildGrowthChartData({ cpfHistory, snapshots, fallbackCash, fallbackNetWorth, fallbackCpf, fallbackSavings }) {
  const monthMap = new Map()

  const cpfSorted = [...cpfHistory].sort((a, b) => a.month.localeCompare(b.month))
  cpfSorted.forEach(e => {
    monthMap.set(e.month, { ...monthMap.get(e.month), cpf: e.oa + e.sa + e.ma })
  })

  const now = new Date()
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastCpf = cpfSorted[cpfSorted.length - 1]
  if (lastCpf && lastCpf.month < cur) {
    const base = lastCpf.month > CPF_CONTRIBUTION_BASE ? lastCpf.month : CPF_CONTRIBUTION_BASE
    const n = Math.max(0, cpfMonthsBetween(base, cur))
    if (n > 0) {
      monthMap.set(cur, {
        ...monthMap.get(cur),
        cpf: (lastCpf.oa + CPF_MONTHLY_CONTRIB.oa * n) +
             (lastCpf.sa + CPF_MONTHLY_CONTRIB.sa * n) +
             (lastCpf.ma + CPF_MONTHLY_CONTRIB.ma * n),
        projected: true,
      })
    }
  }

  snapshots.forEach(s => {
    const existing = monthMap.get(s.month) || {}
    monthMap.set(s.month, {
      ...existing,
      cash: s.cash,
      savings: s.savings ?? s.cash,
      netWorth: s.netWorth,
      cpf: existing.cpf ?? s.cpf,
    })
  })

  for (const [month, point] of monthMap.entries()) {
    if (point.cash == null || point.netWorth == null) {
      const cpf = point.cpf ?? fallbackCpf
      monthMap.set(month, {
        ...point,
        cpf,
        cash: point.cash ?? fallbackCash,
        savings: point.savings ?? fallbackSavings,
        netWorth: point.netWorth ?? (fallbackNetWorth - fallbackCpf + cpf),
      })
    }
  }

  return [...monthMap.keys()].sort().slice(-12).map(m => ({ month: m, ...monthMap.get(m) }))
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

// ── Growth line chart ─────────────────────────────────────────────

const CHART_LINES = [
  { key: 'netWorth', color: 'var(--green)',    label: 'Net worth' },
  { key: 'savings',  color: 'var(--lavender)', label: 'Savings'   },
  { key: 'cpf',      color: 'var(--sky)',      label: 'CPF'       },
]

function GrowthChart({ data }) {
  if (!data || data.length < 2) return null

  const VW = 400, VH = 160
  const pad = { t: 8, r: 12, b: 28, l: 12 }
  const cw = VW - pad.l - pad.r
  const ch = VH - pad.t - pad.b

  const allVals = data.flatMap(d => CHART_LINES.map(l => d[l.key]).filter(v => v != null))
  if (!allVals.length) return null
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const range = max - min || 1

  const xOf = i => (pad.l + (i / Math.max(data.length - 1, 1)) * cw).toFixed(1)
  const yOf = v => (pad.t + (1 - (v - min) / range) * ch).toFixed(1)

  function buildPath(key) {
    let d = '', pen = false
    data.forEach((pt, i) => {
      if (pt[key] == null) { pen = false; return }
      d += pen ? ` L${xOf(i)},${yOf(pt[key])}` : `M${xOf(i)},${yOf(pt[key])}`
      pen = true
    })
    return d
  }

  const n = data.length
  const labelIdxs = n <= 6 ? data.map((_, i) => i) : [0, Math.round(n / 3), Math.round(2 * n / 3), n - 1]

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
        {CHART_LINES.map(({ key, color, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <div style={{ width: 18, height: 2.5, background: color, borderRadius: 2 }} />
            {label}
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: 'auto' }}>
        {CHART_LINES.map(({ key, color }) => {
          const path = buildPath(key)
          return path ? (
            <path key={key} d={path} fill="none" stroke={color} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          ) : null
        })}
        {CHART_LINES.map(({ key, color }) =>
          data.map((pt, i) => pt[key] != null ? (
            <circle key={`${key}-${i}`} cx={xOf(i)} cy={yOf(pt[key])} r="2.5"
              fill={pt.projected ? 'var(--bg-surface)' : color}
              stroke={pt.projected ? color : 'none'} strokeWidth="1.5"
            />
          ) : null)
        )}
        {labelIdxs.map(i => {
          const [yr, mo] = data[i].month.split('-').map(Number)
          const label = new Date(yr, mo - 1, 1).toLocaleDateString('en-SG', { month: 'short', year: '2-digit' })
          const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'
          return (
            <text key={i} x={xOf(i)} y={VH - 2} textAnchor={anchor}
              fontSize="10" fill="var(--text-tertiary)" fontFamily="inherit">
              {label}
            </text>
          )
        })}
      </svg>
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
  const [cpfHistory,    setCpfHistory]    = useState([])
  const [snapshots,     setSnapshots]     = useState([])
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
        const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
          fetch('/api/finance/accounts'),
          fetch('/api/finance/cpf/latest'),
          fetch(`/api/finance/budgets/summary?month=${month}`),
          fetch('/api/finance/buckets'),
          fetch('/api/finance/payback'),
          fetch('/api/finance/cpf'),
          fetch('/api/finance/snapshots'),
        ])
        const [a, c, b, bk, pb, ch, sn] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json(), r5.json(), r6.json(), r7.json()])
        if (cancelled) return
        if (a.success)  setAccounts(a.data)
        if (c.success)  setCpf(c.data)
        if (b.success)  { setBudgetSummary(b.data); setIncome(b.income ?? 0) }
        if (bk.success) setBuckets(bk.data)
        if (pb.success) setPaybackTotal(pb.data.reduce((s, i) => s + i.remaining, 0))
        if (ch.success) setCpfHistory(ch.data)
        if (sn.success) setSnapshots(sn.data)

        // Auto-save current month snapshot (fire-and-forget)
        if (a.success && c.success) {
          const accs    = a.data
          const cash    = accs.filter(x => x.role !== 'liability').reduce((s, x) => s + x.balance, 0)
          const liab    = accs.filter(x => x.role === 'liability').reduce((s, x) => s + x.balance, 0)
          const pbAmt   = pb.success ? pb.data.reduce((s, i) => s + i.remaining, 0) : 0
          const cpfProj = projectCpf(c.data)
          const cpfAmt  = cpfProj ? cpfProj.oa + cpfProj.sa + cpfProj.ma : 0
          const currentSpent = b.success ? b.data.reduce((s, item) => s + (item.spent ?? 0), 0) : 0
          const currentBucketCommitments = bk.success
            ? bk.data
                .filter(bucket => bucket.status === 'Active' || bucket.status === 'Funded')
                .reduce((s, bucket) => s + (bucket.type === 'Repayment' ? (bucket.monthlyRepayment || 0) : (bucket.monthlyTopUp || 0)), 0)
            : 0
          const currentMonthlySavings = (b.success ? (b.income ?? 0) : 0) - currentSpent - currentBucketCommitments
          const currentSavingsTotal = cash + currentMonthlySavings
          const currentNetWorth = currentSavingsTotal + cpfAmt - liab - pbAmt

          if (ch.success && sn.success) {
            const growthSeries = buildGrowthChartData({
              cpfHistory: ch.data,
              snapshots: sn.data,
              fallbackCash: cash,
              fallbackNetWorth: currentNetWorth,
              fallbackCpf: cpfAmt,
              fallbackSavings: currentSavingsTotal,
            })
            const existingMonths = new Set(sn.data.map(s => s.month))
            growthSeries
              .filter(point => point.month !== month && !existingMonths.has(point.month) && point.cash != null && point.netWorth != null)
              .forEach(point => {
                fetch('/api/finance/snapshots', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ month: point.month, cash: point.cash, savings: point.savings, cpf: point.cpf, netWorth: point.netWorth }),
                }).catch(() => {})
              })
          }

          fetch('/api/finance/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, cash, savings: currentSavingsTotal, cpf: cpfAmt, netWorth: currentNetWorth }),
          }).catch(() => {})
        }
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
  const projectedCpf     = projectCpf(cpf)
  const cpfTotal         = projectedCpf ? (projectedCpf.oa + projectedCpf.sa + projectedCpf.ma) : 0

  const totalLimit   = budgetSummary.reduce((s, b) => s + b.monthlyLimit, 0)
  const totalSpent   = budgetSummary.reduce((s, b) => s + b.spent, 0)
  const totalPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const net          = income - totalSpent
  const spendStatus  = totalSpent > totalLimit ? 'over' : totalPercent >= 80 ? 'warning' : 'ok'
  const totalBucketCommitments = buckets
    .filter(b => b.status === 'Active' || b.status === 'Funded')
    .reduce((s, b) => s + (b.type === 'Repayment' ? (b.monthlyRepayment || 0) : (b.monthlyTopUp || 0)), 0)
  const monthlySavings = income - totalSpent - totalBucketCommitments
  const totalSavings = cashTotal + monthlySavings
  const netWorth = totalSavings + cpfTotal - liabilityTotal - paybackTotal

  const growthChartData = buildGrowthChartData({
    cpfHistory,
    snapshots,
    fallbackCash: cashTotal,
    fallbackNetWorth: netWorth,
    fallbackCpf: cpfTotal,
    fallbackSavings: totalSavings,
  })

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
              {fmtMoney(totalSavings)}
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

      {/* ── Growth Chart ── */}
      {growthChartData.length >= 2 && (
        <Section title="Growth">
          <GrowthChart data={growthChartData} />
        </Section>
      )}

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
