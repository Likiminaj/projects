import { useState } from 'react'

const EMPTY_ROW = { category: '', reduceBy: '', months: '' }

export default function BigSpendModal({ shortfall, bucketId, bucketName, budgetCategories, onDone, onClose }) {
  const [option, setOption]             = useState('A')
  const [monthlyRepayment, setMonthly]  = useState('')
  const [reductionRows, setRows]        = useState([{ ...EMPTY_ROW }])
  const [submitting, setSubmitting]     = useState(false)
  const [err, setErr]                   = useState(null)

  // ── Option A ──────────────────────────────────────────────────
  const repaymentMonths = monthlyRepayment > 0
    ? Math.ceil(shortfall / parseFloat(monthlyRepayment))
    : null

  async function handleRepayment() {
    const amt = parseFloat(monthlyRepayment)
    if (!amt || amt <= 0) { setErr('Enter a monthly repayment amount'); return }
    setSubmitting(true); setErr(null)
    try {
      const res  = await fetch(`/api/finance/buckets/${bucketId}/repayment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortfall, monthlyRepayment: amt }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onDone()
    } catch (e) { setErr(e.message) }
    finally { setSubmitting(false) }
  }

  // ── Option B ──────────────────────────────────────────────────
  const totalAbsorbed = reductionRows.reduce((s, r) => {
    const rb = parseFloat(r.reduceBy) || 0
    const m  = parseFloat(r.months)   || 0
    return s + rb * m
  }, 0)
  const absorbed = Math.min(totalAbsorbed, shortfall * 2) // cap display
  const canSubmitB = totalAbsorbed >= shortfall &&
    reductionRows.every(r => r.category && r.reduceBy && r.months)

  function updateRow(idx, patch) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  async function handleReductionPlan() {
    if (!canSubmitB) { setErr('Fill all rows and ensure absorbed >= shortfall'); return }
    setSubmitting(true); setErr(null)
    try {
      const reductions = reductionRows.map(r => ({
        category: r.category,
        reduceBy: parseFloat(r.reduceBy),
        months:   parseInt(r.months),
      }))
      const res  = await fetch(`/api/finance/buckets/${bucketId}/reduction-plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortfall, reductions }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onDone()
    } catch (e) { setErr(e.message) }
    finally { setSubmitting(false) }
  }

  const panelStyle = active => ({
    border: `2px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)',
    padding: 20,
    cursor: 'pointer',
    background: active ? 'var(--amber-light)' : 'var(--bg-surface)',
    transition: 'all 180ms var(--ease)',
  })

  return (
    <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal" style={{ maxWidth: 540 }}>

        <div className="ds-modal__header">
          <div>
            <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>
              Bucket shortfall: ${shortfall.toFixed(2)}
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
              Your <strong>{bucketName}</strong> bucket didn't fully cover this purchase.
              How do you want to handle ${shortfall.toFixed(2)}?
            </p>
          </div>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ds-modal__body">

          {/* Option A */}
          <div style={panelStyle(option === 'A')} onClick={() => setOption('A')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                background: option === 'A' ? 'var(--amber)' : 'var(--bg-sunken)',
                fontSize: 'var(--text-xs)', fontWeight: 800, flexShrink: 0,
              }}>A</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Repayment bucket</span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 14 }}>
              Spread ${shortfall.toFixed(2)} as a monthly self-loan.
            </p>
            {option === 'A' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>$</span>
                  <input
                    className="ds-input"
                    type="number" min="0" step="0.01"
                    placeholder="Monthly repayment"
                    style={{ paddingLeft: 26 }}
                    value={monthlyRepayment}
                    onChange={e => { setMonthly(e.target.value); setErr(null) }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                {repaymentMonths && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    → {repaymentMonths} month{repaymentMonths !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Option B */}
          <div style={panelStyle(option === 'B')} onClick={() => setOption('B')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                background: option === 'B' ? 'var(--amber)' : 'var(--bg-sunken)',
                fontSize: 'var(--text-xs)', fontWeight: 800, flexShrink: 0,
              }}>B</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Spend reduction plan</span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: option === 'B' ? 14 : 0 }}>
              Temporarily reduce budgets to absorb the shortfall over time.
            </p>

            {option === 'B' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} onClick={e => e.stopPropagation()}>
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 28px', gap: 8 }}>
                  {['Category', 'Reduce by/mo', 'Months', ''].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)' }}>{h}</span>
                  ))}
                </div>

                {reductionRows.map((row, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 28px', gap: 8, alignItems: 'center' }}>
                    <select
                      value={row.category}
                      onChange={e => updateRow(idx, { category: e.target.value })}
                      style={{
                        fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)',
                        background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', outline: 'none',
                        color: row.category ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        padding: '8px 10px',
                      }}
                    >
                      <option value="">Category…</option>
                      {budgetCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>$</span>
                      <input
                        type="number" min="0" step="0.01" placeholder="0"
                        value={row.reduceBy}
                        onChange={e => updateRow(idx, { reduceBy: e.target.value })}
                        style={{
                          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)',
                          background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', outline: 'none',
                          color: 'var(--text-primary)', padding: '8px 8px 8px 22px', width: '100%',
                        }}
                      />
                    </div>
                    <input
                      type="number" min="1" step="1" placeholder="0"
                      value={row.months}
                      onChange={e => updateRow(idx, { months: e.target.value })}
                      style={{
                        fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)',
                        background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', outline: 'none',
                        color: 'var(--text-primary)', padding: '8px', width: '100%',
                      }}
                    />
                    <button
                      onClick={() => setRows(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', lineHeight: 1, padding: 0 }}
                    >✕</button>
                  </div>
                ))}

                <button
                  onClick={() => setRows(prev => [...prev, { ...EMPTY_ROW }])}
                  style={{
                    alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600,
                    fontFamily: 'var(--font-sans)', padding: 0,
                  }}
                >+ Add category</button>

                {/* Running total */}
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: totalAbsorbed >= shortfall ? 'var(--green-light)' : 'var(--bg-sunken)',
                  fontSize: 'var(--text-xs)', fontWeight: 600,
                  color: totalAbsorbed >= shortfall ? '#1e5c1b' : 'var(--text-secondary)',
                }}>
                  Absorbed: ${Math.min(totalAbsorbed, 999999).toFixed(2)} of ${shortfall.toFixed(2)}
                  {totalAbsorbed >= shortfall && ' ✓'}
                </div>
              </div>
            )}
          </div>

          {err && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--coral)', margin: 0 }}>{err}</p>}
        </div>

        <div className="ds-modal__footer" style={{ justifyContent: 'space-between' }}>
          <button className="ds-btn ds-btn--ghost" onClick={onClose} disabled={submitting}>
            Skip for now
          </button>
          <button
            className="ds-btn ds-btn--primary"
            disabled={submitting || (option === 'B' && !canSubmitB)}
            onClick={option === 'A' ? handleRepayment : handleReductionPlan}
          >
            {submitting ? 'Creating…' : option === 'A' ? 'Create repayment bucket' : 'Create reduction plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
