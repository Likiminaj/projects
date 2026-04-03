import { useState } from 'react'
import CircularRing from '../../components/CircularRing.jsx'

const TYPE_COLORS = {
  Permanent: { bg: '#DDF0F8', text: '#1A5C8A' },
  Temporary:  { bg: '#FDF0D0', text: '#8A5F00' },
  Repayment:  { bg: '#FAD9D5', text: '#9A2A1A' },
}

function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.Permanent
  return (
    <span style={{
      fontSize: 'var(--text-xs)', fontWeight: 700, borderRadius: 999,
      padding: '3px 10px', background: c.bg, color: c.text, whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  )
}

function BucketRow({ bucket, onRefresh }) {
  const [expanded, setExpanded]     = useState(false)
  const [allocInput, setAllocInput] = useState('')
  const [allocating, setAllocating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [err, setErr]               = useState(null)

  async function submitAllocate() {
    const amt = parseFloat(allocInput)
    if (!amt || amt <= 0) { setErr('Enter a valid amount'); return }
    setAllocating(true); setErr(null)
    try {
      const res  = await fetch(`/api/finance/buckets/${bucket.id}/allocate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAllocInput('')
      setExpanded(false)
      onRefresh()
    } catch (e) { setErr(e.message) }
    finally { setAllocating(false) }
  }

  async function submitDissolve() {
    setDissolving(true)
    try {
      const res  = await fetch(`/api/finance/buckets/${bucket.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onRefresh()
    } catch (e) { setErr(e.message) }
    finally { setDissolving(false); setConfirming(false) }
  }

  const isRepayment = bucket.type === 'Repayment'
  const months = bucket.monthsRemaining

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', cursor: 'pointer',
          background: expanded ? 'var(--bg-sunken)' : 'transparent',
          transition: 'background 150ms var(--ease)',
        }}
      >
        <CircularRing
          percent={bucket.percentFunded}
          size={44}
          stroke={5}
          color={bucket.status === 'Funded' || bucket.status === 'Completed' ? 'var(--green)' : bucket.percentFunded >= 80 ? 'var(--amber)' : 'var(--sky)'}
          label={`${Math.round(bucket.percentFunded)}%`}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              {bucket.name}
            </span>
            <TypeBadge type={bucket.type} />
            {!bucket.onTrack && bucket.targetDate && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--coral)', fontWeight: 600 }}>Behind</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ${bucket.currentAmount.toFixed(0)} / ${bucket.targetAmount.toFixed(0)}
            </span>
            {months != null && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                · {months}mo left
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '12px 20px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isRepayment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)',
                  pointerEvents: 'none',
                }}>$</span>
                <input
                  className="ds-input"
                  type="number" min="0" step="0.01" placeholder="Amount to add"
                  style={{ paddingLeft: 26 }}
                  value={allocInput}
                  onChange={e => { setAllocInput(e.target.value); setErr(null) }}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <button
                className="ds-btn ds-btn--primary ds-btn--sm"
                onClick={e => { e.stopPropagation(); submitAllocate() }}
                disabled={allocating}
              >
                {allocating ? '…' : '+ Allocate'}
              </button>
            </div>
          )}

          {isRepayment && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Monthly repayment: <strong>${bucket.monthlyRepayment.toFixed(2)}</strong>
              {' · '}Owed: <strong>${bucket.amountOwed.toFixed(2)}</strong>
            </div>
          )}

          {err && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--coral)', margin: 0 }}>{err}</p>}

          {!confirming ? (
            <button
              onClick={e => { e.stopPropagation(); setConfirming(true) }}
              style={{
                alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)',
                padding: 0, textDecoration: 'underline', fontWeight: 600,
              }}
            >
              Dissolve bucket
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Dissolve "{bucket.name}"?</span>
              <button
                className="ds-btn ds-btn--danger ds-btn--sm"
                onClick={e => { e.stopPropagation(); submitDissolve() }}
                disabled={dissolving}
              >{dissolving ? '…' : 'Confirm'}</button>
              <button className="ds-btn ds-btn--ghost ds-btn--sm"
                onClick={e => { e.stopPropagation(); setConfirming(false) }}
              >Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const EMPTY_FORM = { name: '', type: 'Temporary', targetAmount: '', monthlyTopUp: '', targetDate: '' }

export default function BucketsSection({ buckets, loading, onRefresh }) {
  const [showModal, setShowModal]       = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [err, setErr]                   = useState(null)

  const active     = buckets.filter(b => b.status !== 'Completed' && b.status !== 'Dissolved' && b.type !== 'Repayment')
  const repayments = buckets.filter(b => b.type === 'Repayment' && b.status !== 'Completed' && b.status !== 'Dissolved')

  const totalCommitted =
    active.reduce((s, b) => s + (b.monthlyTopUp || 0), 0) +
    repayments.reduce((s, b) => s + (b.monthlyRepayment || 0), 0)

  const totalCurrentAmount = active.reduce((s, b) => s + b.currentAmount, 0)
  const totalTargetAmount  = active.reduce((s, b) => s + b.targetAmount,  0)
  const overallPct         = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.targetAmount) { setErr('Name and target amount are required'); return }
    setSaving(true); setErr(null)
    try {
      const res  = await fetch('/api/finance/buckets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         form.name.trim(),
          type:         form.type,
          targetAmount: parseFloat(form.targetAmount),
          monthlyTopUp: parseFloat(form.monthlyTopUp) || 0,
          targetDate:   form.targetDate || null,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setForm(EMPTY_FORM)
      setShowNew(false)
      onRefresh()
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  function closeModal() {
    setShowModal(false)
    setShowNew(false)
    setForm(EMPTY_FORM)
    setErr(null)
  }

  // ── Compact card ─────────────────────────────────────────────────
  return (
    <>
      <div
        className={`ds-card ds-card--padded${loading ? '' : ' ds-card--clickable'}`}
        onClick={() => !loading && setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && !loading && setShowModal(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', flex: 1 }}>
              Buckets
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>›</span>
          </div>
          {loading ? (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Loading…</span>
          ) : active.length > 0 || repayments.length > 0 ? (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              ${totalCommitted.toFixed(0)}/mo committed · {active.length} active
            </span>
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>No active buckets</span>
          )}
        </div>
        {!loading && active.length > 0 && (
          <CircularRing
            percent={overallPct}
            size={64}
            stroke={6}
            color={overallPct >= 100 ? 'var(--green)' : overallPct >= 80 ? 'var(--amber)' : 'var(--sky)'}
            label={`${Math.round(overallPct)}%`}
          />
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="ds-modal">
            <div className="ds-modal__header">
              <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>Buckets</h2>
              <button className="ds-modal__close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            <div className="ds-modal__body" style={{ gap: 16 }}>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--sky-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <p className="ds-label" style={{ color: '#1A5C8A', marginBottom: 6 }}>Committed/mo</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800 }}>${totalCommitted.toFixed(0)}</p>
                </div>
                <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <p className="ds-label" style={{ color: '#1e5c1b', marginBottom: 6 }}>In buckets</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800 }}>${totalCurrentAmount.toFixed(0)}</p>
                </div>
                <div style={{ background: 'var(--lavender-light)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <p className="ds-label" style={{ color: '#5B3D7A', marginBottom: 6 }}>Active</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800 }}>{active.length}</p>
                </div>
              </div>

              {/* New bucket form */}
              {showNew && (
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      className="ds-input" placeholder="Bucket name" required style={{ flex: 2, minWidth: 140 }}
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 160 }}>
                      {['Temporary', 'Permanent'].map(t => (
                        <button key={t} type="button"
                          onClick={() => setForm(f => ({ ...f, type: t }))}
                          style={{
                            flex: 1, padding: '10px 12px', borderRadius: 999, cursor: 'pointer',
                            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 700,
                            border: '2px solid var(--amber)',
                            background: form.type === t ? 'var(--amber)' : 'transparent',
                            color: form.type === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >{t}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 120 }}>
                      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>$</span>
                      <input className="ds-input" type="number" min="0" step="0.01" placeholder="Target amount" required
                        style={{ paddingLeft: 26, width: '100%' }}
                        value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                      />
                    </div>
                    <div style={{ position: 'relative', flex: 1, minWidth: 120 }}>
                      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>$</span>
                      <input className="ds-input" type="number" min="0" step="0.01" placeholder="Monthly top-up"
                        style={{ paddingLeft: 26, width: '100%' }}
                        value={form.monthlyTopUp} onChange={e => setForm(f => ({ ...f, monthlyTopUp: e.target.value }))}
                      />
                    </div>
                    {form.type === 'Temporary' && (
                      <input className="ds-input" type="date" style={{ flex: 1, minWidth: 140 }}
                        value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                      />
                    )}
                  </div>
                  {err && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--coral)', margin: 0 }}>{err}</p>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => { setShowNew(false); setErr(null) }}>Cancel</button>
                    <button type="submit" className="ds-btn ds-btn--primary ds-btn--sm" disabled={saving}>
                      {saving ? 'Creating…' : 'Create bucket'}
                    </button>
                  </div>
                </form>
              )}

              {/* Active buckets */}
              {active.length === 0 && !showNew ? (
                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', padding: '16px 0' }}>
                  No active buckets. Create one to start saving.
                </p>
              ) : (
                <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {active.map(b => (
                    <BucketRow key={b.id} bucket={b} onRefresh={onRefresh} />
                  ))}
                </div>
              )}

              {/* Repayments */}
              {repayments.length > 0 && (
                <div>
                  <p className="ds-label" style={{ marginBottom: 8 }}>Repayments</p>
                  <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {repayments.map(b => (
                      <BucketRow key={b.id} bucket={b} onRefresh={onRefresh} />
                    ))}
                  </div>
                </div>
              )}

              {/* Show completed toggle */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => { setShowCompleted(v => !v); onRefresh(!showCompleted) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontWeight: 600, textDecoration: 'underline', padding: 0 }}
                >
                  {showCompleted ? 'Hide completed & dissolved' : 'Show completed & dissolved'}
                </button>
              </div>
            </div>

            <div className="ds-modal__footer">
              <button className="ds-btn ds-btn--ghost" onClick={closeModal}>Close</button>
              <button className="ds-btn ds-btn--outline ds-btn--sm" onClick={() => { setShowNew(v => !v); setErr(null) }}>
                {showNew ? 'Cancel new' : '+ New bucket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
