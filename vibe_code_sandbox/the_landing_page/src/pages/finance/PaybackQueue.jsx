import { useEffect, useState } from 'react'

function fmtMoney(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtDate(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Add modal ─────────────────────────────────────────────────────

function AddPaybackModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', amount: '', sourceBucket: '', date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const res  = await fetch('/api/finance/payback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onSaved(json.data)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal">
        <div className="ds-modal__header">
          <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>Add to Payback Queue</h2>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ds-modal__body">
          <form id="add-payback-form" onSubmit={handleSubmit} className="ds-col ds-gap-3">

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 120 }}>What for</span>
              <input className="ds-input ds-flex-1" required
                placeholder="e.g. Emergency car repair"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 120 }}>Amount</span>
              <div className="ds-flex-1" style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none',
                }}>$</span>
                <input className="ds-input" style={{ paddingLeft: 26, width: '100%' }} required
                  type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 120 }}>From bucket</span>
              <input className="ds-input ds-flex-1" placeholder="e.g. Emergency Fund (optional)"
                value={form.sourceBucket} onChange={e => setForm(f => ({ ...f, sourceBucket: e.target.value }))} />
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 120 }}>Date</span>
              <input className="ds-input ds-flex-1" type="date"
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 120 }}>Notes</span>
              <input className="ds-input ds-flex-1" placeholder="Optional"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {error && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--coral)', margin: 0 }}>{error}</p>}
          </form>
        </div>

        <div className="ds-modal__footer">
          <button className="ds-btn ds-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="add-payback-form" disabled={saving} className="ds-btn ds-btn--primary">
            {saving ? 'Adding…' : 'Add to queue'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Repay modal ───────────────────────────────────────────────────

function RepayModal({ item, onClose, onRepaid }) {
  const [amount,  setAmount]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const val = parseFloat(amount)
    if (isNaN(val) || val <= 0) { setError('Enter a valid amount'); return }
    setSaving(true); setError(null)
    try {
      const res  = await fetch(`/api/finance/payback/${item.id}/repay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onRepaid(json.data, json.repaid)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal" style={{ maxWidth: 400 }}>
        <div className="ds-modal__header">
          <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>Repay</h2>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ds-modal__body">
          <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{item.name}</strong>
            <br />
            {fmtMoney(item.remaining)} remaining
          </p>

          <form id="repay-form" onSubmit={handleSubmit} className="ds-col ds-gap-3">
            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 80 }}>Amount</span>
              <div className="ds-flex-1" style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none',
                }}>$</span>
                <input className="ds-input" style={{ paddingLeft: 26, width: '100%' }} autoFocus
                  type="number" min="0.01" step="0.01" max={item.remaining} placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {[item.remaining / 2, item.remaining].map(preset => (
                <button
                  key={preset}
                  type="button"
                  className="ds-btn ds-btn--ghost ds-btn--sm"
                  onClick={() => setAmount(String(preset.toFixed(2)))}
                >
                  {fmtMoney(preset)}
                </button>
              ))}
            </div>

            {error && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--coral)', margin: 0 }}>{error}</p>}
          </form>
        </div>

        <div className="ds-modal__footer">
          <button className="ds-btn ds-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="repay-form" disabled={saving} className="ds-btn ds-btn--primary">
            {saving ? 'Saving…' : 'Apply payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function PaybackQueue() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [repaying, setRepaying] = useState(null)  // item being repaid

  useEffect(() => {
    fetch('/api/finance/payback')
      .then(r => r.json())
      .then(j => { if (j.success) setItems(j.data) })
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!confirm('Remove this item from the queue?')) return
    await fetch(`/api/finance/payback/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const total = items.reduce((s, i) => s + i.remaining, 0)

  return (
    <div className="ds-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 className="ds-heading" style={{ fontSize: 'var(--text-xl)', margin: '0 0 4px' }}>Payback Queue</h1>
          {total > 0 && (
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {fmtMoney(total)} outstanding
            </p>
          )}
        </div>
        <button className="ds-btn ds-btn--primary ds-btn--sm" onClick={() => setShowAdd(true)}>
          + Add
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading…</p>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', lineHeight: 1.7,
        }}>
          No outstanding paybacks.
          <br />
          When you borrow from your savings buckets, track it here.
        </div>
      ) : (
        <div className="ds-card" style={{ overflow: 'hidden' }}>
          {items.map((item, idx) => {
            const pct = item.amount > 0 ? ((item.amount - item.remaining) / item.amount) * 100 : 0
            const isLast = idx === items.length - 1

            return (
              <div key={item.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                <div style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  {/* Progress ring */}
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    {(() => {
                      const size = 44, stroke = 5
                      const r    = (size - stroke) / 2
                      const circ = 2 * Math.PI * r
                      const off  = circ - (Math.min(pct, 100) / 100) * circ
                      return (
                        <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
                          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={stroke} />
                          <circle cx={size/2} cy={size/2} r={r} fill="none"
                            stroke={pct >= 100 ? 'var(--green)' : 'var(--coral)'}
                            strokeWidth={stroke}
                            strokeDasharray={circ} strokeDashoffset={off}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 500ms ease' }}
                          />
                        </svg>
                      )
                    })()}
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em',
                    }}>
                      {Math.round(pct)}%
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                      {fmtMoney(item.remaining)} left of {fmtMoney(item.amount)}
                      {item.sourceBucket && ` · from ${item.sourceBucket}`}
                      {item.date && ` · ${fmtDate(item.date)}`}
                    </p>
                    {item.notes && (
                      <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="ds-btn ds-btn--outline ds-btn--sm"
                      onClick={() => setRepaying(item)}
                    >
                      Repay
                    </button>
                    <button
                      className="ds-btn ds-btn--ghost ds-btn--sm"
                      onClick={() => handleDelete(item.id)}
                      style={{ color: 'var(--coral)' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: 'var(--bg-sunken)', margin: '0 20px 12px' }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${Math.min(pct, 100)}%`,
                    background: pct >= 100 ? 'var(--green)' : 'var(--coral)',
                    transition: 'width 400ms ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <AddPaybackModal
          onClose={() => setShowAdd(false)}
          onSaved={item => {
            setItems(prev => [item, ...prev])
            setShowAdd(false)
          }}
        />
      )}

      {repaying && (
        <RepayModal
          item={repaying}
          onClose={() => setRepaying(null)}
          onRepaid={(updated, isRepaid) => {
            if (isRepaid) {
              setItems(prev => prev.filter(i => i.id !== updated.id))
            } else {
              setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
            }
            setRepaying(null)
          }}
        />
      )}
    </div>
  )
}
