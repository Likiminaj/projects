import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AddTransactionModal from './AddTransactionModal.jsx'
import LogRecurringModal from './LogRecurringModal.jsx'

// ── Utilities ─────────────────────────────────────────────────────

function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return toMonthKey(d)
}
function fmtMoney(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function completenessOf(transactions, recurring, txAdded) {
  const monthlyExpenses = recurring.filter(
    r => r.active && r.direction === 'Expense' && r.frequency === 'Monthly'
  )
  const total = transactions.length + txAdded
  if (total === 0)
    return { level: 'none', msg: 'No transactions logged yet — a great time to start.' }
  if (total >= Math.max(3, monthlyExpenses.length * 0.7))
    return { level: 'good', msg: "You've logged most of your activity." }
  return { level: 'partial', msg: 'Some entries may be missing — worth a quick check.' }
}

function topInsights(budgetSummary, lastSummary) {
  const out = []
  for (const b of budgetSummary) {
    if (b.monthlyLimit === 0 || b.spent < 20) continue
    const prev = lastSummary.find(l => l.category === b.category)
    if (!prev || prev.spent < 10) continue
    const pct = (b.spent - prev.spent) / prev.spent
    if (pct > 0.2) out.push({ category: b.category, pct: Math.round(pct * 100), spent: b.spent })
  }
  return out.sort((a, b) => b.pct - a.pct).slice(0, 2)
}

// ── Confetti ──────────────────────────────────────────────────────

function Confetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width  = W
    canvas.height = H

    const COLORS = [
      '#8CC98A', '#D6EDCF',
      '#F2B84B', '#FDF0D0',
      '#E8796A', '#FAD9D5',
      '#C4A8D8', '#EDE5F5',
      '#A8C8E8', '#DDF0F8',
    ]

    const FLOOR   = H - 18
    const COL_W   = 8
    const numCols = Math.ceil(W / COL_W) + 1
    const colFloor = new Float32Array(numCols).fill(FLOOR)

    // Burst from page center
    const OX = W / 2
    const OY = H * 0.5

    const pieces = Array.from({ length: 180 }, () => ({
      x:        OX + (Math.random() - 0.5) * 40,
      y:        OY,
      w:        5 + Math.random() * 9,
      h:        7 + Math.random() * 7,
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
      vx:       (Math.random() - 0.5) * 20,        // wide horizontal spread
      vy:       -(6 + Math.random() * 12),          // upward burst, -18 to -6
      rotation: Math.random() * Math.PI * 2,
      spin:     (Math.random() - 0.5) * 0.18,
      opacity:  0.85 + Math.random() * 0.15,
      delay:    Math.floor(Math.random() * 28),     // stagger the burst over ~28 frames
      settled:  false,
    }))

    function bucketFloor(p) {
      const b0 = Math.max(0, Math.floor(p.x / COL_W))
      const b1 = Math.min(numCols - 1, Math.floor((p.x + p.w) / COL_W))
      let f = FLOOR
      for (let b = b0; b <= b1; b++) f = Math.min(f, colFloor[b])
      return f
    }

    function settle(p) {
      p.settled = true
      p.spin    = 0
      p.vx      = 0
      p.vy      = 0
      const b0 = Math.max(0, Math.floor(p.x / COL_W))
      const b1 = Math.min(numCols - 1, Math.floor((p.x + p.w) / COL_W))
      for (let b = b0; b <= b1; b++) colFloor[b] = Math.min(colFloor[b], p.y)
    }

    let raf

    function draw() {
      ctx.clearRect(0, 0, W, H)
      let anyActive = false

      for (const p of pieces) {
        // Stagger: skip (invisible + frozen) until delay burns down
        if (p.delay > 0) { p.delay--; anyActive = true; continue }

        if (!p.settled) {
          anyActive = true
          p.x  += p.vx
          p.y  += p.vy
          p.vy += 0.28           // gravity — snappy arcs
          p.vx *= 0.988          // light air resistance
          p.rotation += p.spin

          const floor = bucketFloor(p)
          if (p.y + p.h >= floor) {
            p.y = floor - p.h
            settle(p)
          }
        }

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }

      if (anyActive) raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  )
}

// ── Step 0: Welcome ───────────────────────────────────────────────

function WelcomeStep({ loading, onContinue }) {
  return (
    <>
      <Confetti />
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '82vh',
        textAlign: 'center', padding: '40px 8px',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', marginBottom: 36,
          background: 'var(--green-light)', border: '2px solid var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#1e5c1b',
        }}>
          ✓
        </div>

        <p style={{
          fontSize: 'var(--text-lg)', fontWeight: 700, lineHeight: 1.65,
          color: 'var(--text-primary)', maxWidth: 400, margin: '0 0 16px',
        }}>
          Well done for showing up for your financial review.
        </p>
        <p style={{
          fontSize: 'var(--text-base)', lineHeight: 1.75,
          color: 'var(--text-secondary)', maxWidth: 340, margin: '0 0 48px',
        }}>
          This is not easy, and you're doing it anyway.
          <br />
          <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            You are someone who follows through.
          </strong>
        </p>

        <button
          className="ds-btn ds-btn--primary"
          onClick={onContinue}
          disabled={loading}
          style={{ padding: '12px 36px', fontSize: 'var(--text-sm)', minWidth: 140 }}
        >
          {loading ? 'Getting ready…' : "Let's begin"}
        </button>
      </div>
    </>
  )
}

// ── Step 1: Log checkpoint ────────────────────────────────────────

function LogStep({ completeness, categories, sources, recurring, buckets, onContinue, onTxSaved }) {
  const [showTx, setShowTx] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)

  const signalColor = {
    good: 'var(--green)', partial: 'var(--amber)', none: 'var(--coral)',
  }[completeness.level]

  return (
    <div style={{ padding: '48px 0 32px' }}>
      <p className="ds-label" style={{ marginBottom: 10 }}>Step 1 of 3</p>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px' }}>
        Log your activity
      </h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '0 0 28px', lineHeight: 1.65 }}>
        Before we look at the numbers, let's make sure everything is in.
      </p>

      {/* Completeness signal */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', marginBottom: 24,
        background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)',
        borderLeft: `3px solid ${signalColor}`,
      }}>
        {completeness.msg}
      </div>

      {/* Action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 32 }}>
        <button
          onClick={() => setShowTx(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '18px 20px', cursor: 'pointer', textAlign: 'left', width: '100%',
            background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <span style={{
            width: 38, height: 38, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: 'var(--green-light)', border: '1.5px solid var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#1e5c1b',
          }}>+</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              Log transactions
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              Add purchases, transfers, or income from this period
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowRecurring(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '18px 20px', cursor: 'pointer', textAlign: 'left', width: '100%',
            background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <span style={{
            width: 38, height: 38, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: 'var(--lavender-light)', border: '1.5px solid var(--lavender)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#5B3D7A',
          }}>↻</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              Log recurring items
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              Open the recurring picker in a modal
            </p>
          </div>
        </button>
      </div>

      <button
        className="ds-btn ds-btn--primary"
        onClick={onContinue}
        style={{ width: '100%', padding: '13px', fontSize: 'var(--text-sm)' }}
      >
        I've logged everything →
      </button>

      {showTx && (
        <AddTransactionModal
          categories={categories}
          sources={sources}
          buckets={buckets}
          onSourceAdded={() => {}}
          onSourceDeleted={() => {}}
          onClose={() => setShowTx(false)}
          onSaved={tx => { onTxSaved(1); setShowTx(false) }}
          onBulkSaved={count => { onTxSaved(count); setShowTx(false) }}
        />
      )}

      {showRecurring && (
        <LogRecurringModal
          items={recurring}
          onClose={() => setShowRecurring(false)}
          onDone={count => { onTxSaved(count); setShowRecurring(false) }}
        />
      )}
    </div>
  )
}

// ── Step 2: Allocation ────────────────────────────────────────────

function BucketRow({ bucket, value, onChange, isRepayment, isLast }) {
  const pct = bucket.targetAmount > 0 ? (bucket.currentAmount / bucket.targetAmount) * 100 : 0
  const suggested = isRepayment ? bucket.monthlyRepayment : bucket.monthlyTopUp

  return (
    <div style={{ padding: '14px 18px', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isRepayment ? 0 : 7 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            {bucket.name}
          </p>
          {!isRepayment && bucket.targetAmount > 0 && (
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {fmtMoney(bucket.currentAmount)} of {fmtMoney(bucket.targetAmount)}
            </p>
          )}
          {isRepayment && bucket.amountOwed > 0 && (
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {fmtMoney(bucket.amountOwed)} to close
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 700 }}>+$</span>
          <input
            type="number" min="0" step="0.01"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={suggested > 0 ? String(Math.round(suggested)) : '0'}
            style={{
              width: 76, padding: '6px 10px',
              fontSize: 'var(--text-sm)', fontWeight: 700,
              background: 'var(--bg-sunken)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', outline: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              textAlign: 'right',
            }}
          />
        </div>
      </div>
      {!isRepayment && bucket.targetAmount > 0 && (
        <div style={{ background: 'var(--bg-sunken)', borderRadius: 999, height: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999, transition: 'width 300ms ease',
            width: `${Math.min(pct, 100)}%`,
            background: pct >= 100 ? 'var(--green)' : 'var(--lavender)',
          }} />
        </div>
      )}
    </div>
  )
}

function AllocationStep({ income, buckets, paybackItems, insights, onContinue }) {
  const savings   = buckets.filter(b => b.status === 'Active' && b.type !== 'Repayment')
  const repayment = buckets.filter(b => b.status === 'Repaying')

  const [allocs, setAllocs] = useState(() => {
    const init = {}
    for (const b of [...savings, ...repayment]) {
      const suggested = b.status === 'Repaying' ? b.monthlyRepayment : b.monthlyTopUp
      init[b.id] = suggested > 0 ? String(Math.round(suggested)) : ''
    }
    return init
  })

  // Payback repayment inputs keyed by item id
  const [pbAllocs, setPbAllocs] = useState(() => {
    const init = {}
    for (const item of paybackItems) { init[item.id] = '' }
    return init
  })

  const [committing, setCommitting] = useState(false)

  const bucketTotal  = Object.values(allocs).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const pbTotal      = Object.values(pbAllocs).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const totalAllocated = bucketTotal + pbTotal

  async function commit() {
    setCommitting(true)
    try {
      const bucketCalls = Object.entries(allocs)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([id, amount]) =>
          fetch(`/api/finance/buckets/${id}/allocate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount) }),
          })
        )
      const pbCalls = Object.entries(pbAllocs)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([id, amount]) =>
          fetch(`/api/finance/payback/${id}/repay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amount) }),
          })
        )
      await Promise.all([...bucketCalls, ...pbCalls])
      onContinue()
    } catch {
      setCommitting(false)
    }
  }

  const hasBuckets = savings.length > 0 || repayment.length > 0 || paybackItems.length > 0

  return (
    <div style={{ padding: '48px 0 40px' }}>
      <p className="ds-label" style={{ marginBottom: 10 }}>Step 2 of 3</p>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px' }}>
        Where should your money go?
      </h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '0 0 28px', lineHeight: 1.65 }}>
        Assign money with intention. This is not spending — this is deciding.
      </p>

      {/* Income strip */}
      {income > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 18px', marginBottom: 24,
          background: 'var(--green-light)', border: '1.5px solid var(--green)',
          borderRadius: 'var(--radius-md)',
        }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#1e5c1b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Income this month
          </span>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: '#1e5c1b' }}>
            {fmtMoney(income)}
          </span>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{
              padding: '10px 14px', marginBottom: 8,
              background: 'var(--amber-light)', border: '1px solid var(--amber)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', color: '#7a5000', lineHeight: 1.55,
            }}>
              <strong>{ins.category}</strong> spend was {ins.pct}% higher than last month — something to factor in.
            </div>
          ))}
        </div>
      )}

      {/* SAVINGS section */}
      {savings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Savings
            </p>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>building future</span>
          </div>
          <div style={{
            background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            {savings.map((b, i) => (
              <BucketRow
                key={b.id}
                bucket={b}
                value={allocs[b.id] ?? ''}
                onChange={val => setAllocs(prev => ({ ...prev, [b.id]: val }))}
                isLast={i === savings.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* REPAYMENTS section */}
      {repayment.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Repayments
            </p>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>closing the loop</span>
          </div>
          <div style={{
            background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            {repayment.map((b, i) => (
              <BucketRow
                key={b.id}
                bucket={b}
                value={allocs[b.id] ?? ''}
                onChange={val => setAllocs(prev => ({ ...prev, [b.id]: val }))}
                isRepayment
                isLast={i === repayment.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* PAYBACK QUEUE section */}
      {paybackItems.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Payback queue
            </p>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>pay yourself back</span>
          </div>
          <div style={{
            background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            {paybackItems.map((item, i) => (
              <div key={item.id} style={{
                padding: '14px 18px',
                borderBottom: i === paybackItems.length - 1 ? 'none' : '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {fmtMoney(item.remaining)} remaining
                      {item.sourceBucket && ` · from ${item.sourceBucket}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 700 }}>+$</span>
                    <input
                      type="number" min="0" step="0.01" max={item.remaining}
                      value={pbAllocs[item.id] ?? ''}
                      onChange={e => setPbAllocs(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="0"
                      style={{
                        width: 76, padding: '6px 10px',
                        fontSize: 'var(--text-sm)', fontWeight: 700,
                        background: 'var(--bg-sunken)', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', outline: 'none',
                        color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
                        textAlign: 'right',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasBuckets && (
        <div style={{
          textAlign: 'center', padding: '32px 20px', marginBottom: 24,
          color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', lineHeight: 1.6,
          border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)',
        }}>
          No active savings buckets yet.{' '}
          <Link to="/finance/ledger" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            Add some in the Ledger.
          </Link>
        </div>
      )}

      {/* Total strip */}
      {totalAllocated > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 18px', marginBottom: 24,
          background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)',
        }}>
          <span>Setting aside this period</span>
          <span style={{ color: '#1e5c1b' }}>{fmtMoney(totalAllocated)}</span>
        </div>
      )}

      <button
        className="ds-btn ds-btn--primary"
        onClick={commit}
        disabled={committing}
        style={{ width: '100%', padding: '13px', fontSize: 'var(--text-sm)' }}
      >
        {committing
          ? 'Locking in…'
          : totalAllocated > 0
            ? `Lock in ${fmtMoney(totalAllocated)} →`
            : 'Continue without allocating →'
        }
      </button>
    </div>
  )
}

// ── Step 3: Close ─────────────────────────────────────────────────

function CloseStep({ onDone }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '75vh',
      textAlign: 'center', padding: '40px 8px',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', marginBottom: 32,
        background: 'var(--green)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, boxShadow: '0 4px 20px rgba(34,120,44,0.25)',
      }}>
        ✓
      </div>

      <p style={{
        fontSize: 'var(--text-lg)', fontWeight: 700, lineHeight: 1.6,
        color: 'var(--text-primary)', maxWidth: 340, margin: '0 0 12px',
      }}>
        You've reviewed, adjusted, and planned.
      </p>
      <p style={{
        fontSize: 'var(--text-base)', color: 'var(--text-secondary)',
        maxWidth: 280, margin: '0 0 48px', lineHeight: 1.7,
      }}>
        That's how progress happens.
      </p>

      <button
        className="ds-btn ds-btn--primary"
        onClick={onDone}
        style={{ padding: '12px 36px', fontSize: 'var(--text-sm)' }}
      >
        Back to Finance
      </button>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────

export default function FinancialReview() {
  const navigate = useNavigate()
  const today    = new Date()
  const month    = toMonthKey(today)
  const prevMonth = shiftMonth(month, -1)

  const [step,     setStep]     = useState(0)
  const [data,     setData]     = useState(null)
  const [fetching, setFetching] = useState(true)  // background fetch; does NOT block step 0
  const [txAdded,  setTxAdded]  = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
          fetch(`/api/finance/transactions?month=${month}`),
          fetch('/api/finance/recurring'),
          fetch(`/api/finance/budgets/summary?month=${month}`),
          fetch(`/api/finance/budgets/summary?month=${prevMonth}`),
          fetch('/api/finance/buckets'),
          fetch('/api/finance/categories'),
          fetch('/api/finance/payback'),
        ])
        const [tx, rec, budget, lastBudget, bk, cats, pb] = await Promise.all([
          r1.json(), r2.json(), r3.json(), r4.json(), r5.json(), r6.json(), r7.json(),
        ])
        if (cancelled) return
        setData({
          transactions:  tx.success          ? tx.data               : [],
          recurring:     rec.success         ? rec.data              : [],
          budgetSummary: budget.success      ? budget.data           : [],
          income:        budget.income       ?? 0,
          lastSummary:   lastBudget.success  ? lastBudget.data       : [],
          buckets:       bk.success          ? bk.data               : [],
          categories:    cats.success        ? cats.data?.categories ?? [] : [],
          sources:       cats.success        ? cats.data?.sources    ?? [] : [],
          paybackItems:  pb.success          ? pb.data               : [],
        })
      } finally {
        if (!cancelled) setFetching(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const completeness = data
    ? completenessOf(data.transactions, data.recurring, txAdded)
    : { level: 'none', msg: 'Loading…' }
  const insights = data ? topInsights(data.budgetSummary, data.lastSummary) : []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', justifyContent: 'center' }}>

      {/* Back link */}
      <button
        onClick={() => navigate('/finance')}
        style={{
          position: 'fixed', top: 16, left: 20, zIndex: 100,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 'var(--text-xs)', fontWeight: 600,
          color: 'var(--text-tertiary)', padding: '6px 4px',
        }}
      >
        ← Finance
      </button>

      {/* Step dots */}
      {step > 0 && step < 4 && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6, zIndex: 100,
        }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: s === step ? 20 : 6,
              height: 6, borderRadius: 999,
              background: s === step ? 'var(--text-primary)' : 'var(--border)',
              transition: 'all 300ms ease',
            }} />
          ))}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 520, padding: '0 24px' }}>
        {/* Step 0: shown immediately — no data needed */}
        {step === 0 && (
          <WelcomeStep
            loading={fetching}
            onContinue={() => { if (!fetching) setStep(1) }}
          />
        )}

        {step === 1 && data && (
          <LogStep
            completeness={completeness}
            categories={data.categories}
            sources={data.sources}
            recurring={data.recurring}
            buckets={data.buckets}
            onContinue={() => setStep(2)}
            onTxSaved={count => setTxAdded(n => n + count)}
          />
        )}

        {step === 2 && data && (
          <AllocationStep
            income={data.income}
            buckets={data.buckets}
            paybackItems={data.paybackItems ?? []}
            insights={insights}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && <CloseStep onDone={() => navigate('/finance')} />}
      </div>
    </div>
  )
}
