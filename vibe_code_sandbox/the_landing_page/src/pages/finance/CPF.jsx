import { useState, useEffect, useCallback } from 'react'

const CPF_MONTHLY = { oa: 1495, sa: 390, ma: 520, total: 2405 }

const fmt = (n) =>
  n == null ? '—' : '$' + Number(n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtShort = (n) =>
  n == null ? '—' : '$' + Math.round(n).toLocaleString('en-SG')

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const ACCOUNTS = [
  { key: 'oa', label: 'OA', name: 'Ordinary',  monthly: CPF_MONTHLY.oa, bg: 'var(--green-light)',    color: '#1e5c1b', border: 'var(--green)'    },
  { key: 'sa', label: 'SA', name: 'Special',   monthly: CPF_MONTHLY.sa, bg: 'var(--lavender-light)', color: '#5a3e8a', border: 'var(--lavender)' },
  { key: 'ma', label: 'MA', name: 'MediSave',  monthly: CPF_MONTHLY.ma, bg: 'var(--sky-light)',      color: '#1a5a8a', border: 'var(--sky)'      },
]

const EMPTY_FORM = { month: currentMonth(), oa: '', sa: '', ma: '' }

export default function CPF() {
  const [latest, setLatest]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  const loadLatest = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/finance/cpf/latest').then(r => r.json())
      if (res.success) setLatest(res.data)
      else setError(res.error)
    } catch {
      setError('Failed to load CPF data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLatest() }, [loadLatest])

  async function handleSave() {
    if (!form.month || form.oa === '' || form.sa === '' || form.ma === '') return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/finance/cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: form.month, oa: form.oa, sa: form.sa, ma: form.ma }),
      }).then(r => r.json())
      if (!res.success) throw new Error(res.error)
      setLatest(res.data)
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ds-page">

      {/* ── Hero — Total CPF ───────────────────────────────────────── */}
      <div style={{
        background: 'var(--amber-light)',
        border: '1.5px solid var(--amber)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-4)',
        position: 'relative',
      }}>
        <p className="ds-label" style={{ color: '#7a5000', marginBottom: 'var(--space-2)' }}>Total CPF Balance</p>

        <p style={{
          fontSize: 55,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}>
          {loading ? '…' : fmtShort(latest?.total)}
        </p>

        <p className="ds-caption" style={{ marginBottom: 'var(--space-4)' }}>
          as of {loading ? '…' : (latest?.month ?? '—')}
        </p>

        {/* CPF non-liquid pill */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,255,255,0.7)',
          border: '1.5px solid var(--amber)',
          borderRadius: 'var(--radius-pill)',
          fontSize: 'var(--text-xs)', fontWeight: 700,
          color: '#7a5000', padding: '4px 12px',
        }}>
          🔒 Not liquid · CPF only
        </span>

        {/* Update button */}
        {!showForm && (
          <button
            className="ds-btn ds-btn--primary ds-btn--sm"
            onClick={() => setShowForm(true)}
            style={{ position: 'absolute', top: 'var(--space-5)', right: 'var(--space-5)' }}
          >
            + Update
          </button>
        )}
      </div>

      {/* ── Three Account Cards ────────────────────────────────────── */}
      {!loading && latest && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {ACCOUNTS.map(({ key, label, name, monthly, bg, color, border }) => (
            <div key={key} style={{
              background: bg,
              border: `1.5px solid ${border}`,
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
            }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, opacity: 0.7, marginBottom: 4 }}>
                {label}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color, marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                {name}
              </p>
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 800, letterSpacing: '-0.02em', color, lineHeight: 1.1, marginBottom: 'var(--space-2)' }}>
                {fmt(latest[key])}
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.6)',
                borderRadius: 'var(--radius-pill)',
                fontSize: 13, fontWeight: 700,
                color, padding: '3px 8px',
              }}>
                +{fmtShort(monthly)}/mo
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Monthly Contribution Strip ─────────────────────────────── */}
      <div className="ds-card ds-card--dashed ds-card--padded" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              Monthly contribution · {fmtShort(CPF_MONTHLY.total)}
            </p>
            <p className="ds-caption">
              OA {fmtShort(CPF_MONTHLY.oa)} · SA {fmtShort(CPF_MONTHLY.sa)} · MA {fmtShort(CPF_MONTHLY.ma)}
            </p>
          </div>
          <p className="ds-caption" style={{ textAlign: 'right' }}>
            Not in spendable cash.<br />Updates from Apr 2026.
          </p>
        </div>
      </div>

      {/* ── Inline Update Form ─────────────────────────────────────── */}
      {showForm && (
        <div className="ds-card ds-card--padded" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Add balance update
            </p>
            <button
              className="ds-modal__close"
              style={{ width: 36, height: 36, fontSize: 17 }}
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null) }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              { key: 'month', label: 'Month', type: 'month'  },
              { key: 'oa',    label: 'OA',    type: 'number' },
              { key: 'sa',    label: 'SA',    type: 'number' },
              { key: 'ma',    label: 'MA',    type: 'number' },
            ].map(({ key, label, type }) => (
              <div className="ds-field-row" key={key}>
                <span className="ds-field-label" style={{ width: 60 }}>{label}</span>
                <input
                  type={type}
                  className="ds-input"
                  placeholder={type === 'number' ? '0.00' : undefined}
                  step={type === 'number' ? '0.01' : undefined}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {form.oa && form.sa && form.ma && (
            <p className="ds-caption" style={{ marginTop: 'var(--space-3)', textAlign: 'right' }}>
              Total: <strong style={{ color: 'var(--text-primary)' }}>
                {fmt((parseFloat(form.oa) || 0) + (parseFloat(form.sa) || 0) + (parseFloat(form.ma) || 0))}
              </strong>
            </p>
          )}

          {error && (
            <p style={{ color: 'var(--coral)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
            <button className="ds-btn ds-btn--ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null) }}>
              Cancel
            </button>
            <button
              className="ds-btn ds-btn--primary"
              onClick={handleSave}
              disabled={saving || !form.month || form.oa === '' || form.sa === '' || form.ma === ''}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
