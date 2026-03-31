import { useState } from 'react'

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


function BucketRow({ bucket, onAllocate, onDissolve, onRefresh }) {
  const [expanded, setExpanded]       = useState(false)
  const [allocInput, setAllocInput]   = useState('')
  const [allocating, setAllocating]   = useState(false)
  const [confirming, setConfirming]   = useState(false)
  const [dissolving, setDissolving]   = useState(false)
  const [err, setErr]                 = useState(null)

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
    <div style={{ borderBottom: '1.5px solid var(--border)' }}>
      {/* Main row */}
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

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '12px 20px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Allocate */}
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

          {/* Repayment info */}
          {isRepayment && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Monthly repayment: <strong>${bucket.monthlyRepayment.toFixed(2)}</strong>
              {' · '}Owed: <strong>${bucket.amountOwed.toFixed(2)}</strong>
            </div>
          )}

          {err && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--coral)', margin: 0 }}>{err}</p>}

          {/* Dissolve */}
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

export default function BucketsSection({ buckets, loading, onRefresh, categories }) {
  const [showNew, setShowNew]           = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [err, setErr]                   = useState(null)

  const active     = buckets.filter(b => b.type !== 'Repayment')
  const repayments = buckets.filter(b => b.type === 'Repayment')

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

  return (
    <div className="ds-card" style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1.5px solid var(--border)' }}>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Savings Buckets</span>
        <button className="ds-btn ds-btn--outline ds-btn--sm" onClick={() => { setShowNew(v => !v); setErr(null) }}>
          {showNew ? 'Cancel' : '+ New bucket'}
        </button>
      </div>

      {/* New bucket form */}
      {showNew && (
        <form onSubmit={handleCreate} style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            <button type="submit" className="ds-btn ds-btn--primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create bucket'}
            </button>
          </div>
        </form>
      )}

      {/* Active buckets */}
      {loading && (
        <p style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Loading…</p>
      )}

      {!loading && active.length === 0 && !showNew && (
        <p style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
          No active buckets. Create one to start saving.
        </p>
      )}

      {!loading && active.map(b => (
        <BucketRow key={b.id} bucket={b} onRefresh={onRefresh} />
      ))}

      {/* Repayments sub-section */}
      {!loading && repayments.length > 0 && (
        <>
          <div style={{ padding: '12px 20px 8px', borderTop: '1.5px solid var(--border)' }}>
            <span className="ds-label">Repayments</span>
          </div>
          {repayments.map(b => (
            <BucketRow key={b.id} bucket={b} onRefresh={onRefresh} />
          ))}
        </>
      )}

      {/* Show completed toggle */}
      <div style={{ padding: '12px 20px', borderTop: '1.5px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => { setShowCompleted(v => !v); onRefresh(!showCompleted ? true : false) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontWeight: 600, textDecoration: 'underline', padding: 0 }}
        >
          {showCompleted ? 'Hide completed & dissolved' : 'Show completed & dissolved'}
        </button>
      </div>
    </div>
  )
}
