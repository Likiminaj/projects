import { useEffect, useState } from 'react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EMPTY_FORM = { name: '', budget: '', month: '', day: '', notes: '' }

function fmtBudget(n) {
  return `$${Number(n).toFixed(2)}`
}

function ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return s[(v - 20) % 10] ?? s[v] ?? s[0]
}

export default function Birthdays() {
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState(null)
  const [hoveredId, setHoveredId]   = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  async function fetchEntries() {
    setLoading(true)
    try {
      const res  = await fetch('/api/finance/birthdays')
      const json = await res.json()
      if (json.success) setEntries(json.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchEntries() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Name is required'); return }
    setSaving(true); setErr(null)
    try {
      const res  = await fetch('/api/finance/birthdays', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:   form.name.trim(),
          budget: parseFloat(form.budget) || 0,
          month:  form.month ? parseInt(form.month, 10) : null,
          day:    form.day   ? parseInt(form.day,   10) : null,
          notes:  form.notes.trim(),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setEntries(prev =>
        [...prev, json.data].sort((a, b) => (a.month ?? 99) - (b.month ?? 99))
      )
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      const res  = await fetch(`/api/finance/birthdays/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (e) { alert(`Delete failed: ${e.message}`) }
    finally { setDeletingId(null) }
  }

  // Group entries by month
  const byMonth = {}
  for (const entry of entries) {
    const key = entry.month ?? 0
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(entry)
  }
  const sortedMonths = Object.keys(byMonth).map(Number).sort((a, b) => a - b)

  // Year total
  const yearTotal = entries.reduce((s, e) => s + (e.budget || 0), 0)

  return (
    <div className="ds-page">

      {/* ── Header ── */}
      <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="ds-heading" style={{ fontSize: 'var(--text-xl)' }}>Birthdays</h1>
        <button
          className={`ds-btn ${showForm ? 'ds-btn--ghost' : 'ds-btn--primary'}`}
          onClick={() => { setShowForm(s => !s); setErr(null) }}
        >
          {showForm ? '✕ Cancel' : '+ Add birthday'}
        </button>
      </div>

      {/* ── Year summary strip ── */}
      {!loading && entries.length > 0 && (
        <div style={{
          background: 'var(--lavender-light)', border: '1.5px solid var(--lavender)',
          borderRadius: 'var(--radius-lg)', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#5B3D7A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Yearly birthday budget
          </span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: '#5B3D7A', letterSpacing: '-0.02em' }}>
              {fmtBudget(yearTotal)}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: '#5B3D7A', opacity: 0.7 }}>
              {entries.length} {entries.length === 1 ? 'birthday' : 'birthdays'}
            </span>
          </div>
        </div>
      )}

      {/* ── Add form ── */}
      {showForm && (
        <div className="ds-card ds-card--padded" style={{ marginBottom: 20 }}>
          <p className="ds-label" style={{ marginBottom: 14 }}>New birthday</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 100 }}>Name</span>
              <input className="ds-input ds-flex-1" required placeholder="e.g. Tracy"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 100 }}>Budget</span>
              <div className="ds-flex-1" style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none',
                }}>$</span>
                <input className="ds-input" style={{ paddingLeft: 26, width: '100%' }}
                  type="number" min="0" step="1" placeholder="0"
                  value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
              </div>
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 100 }}>Month</span>
              <select
                className="ds-input ds-flex-1"
                value={form.month}
                onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                style={{ color: form.month ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                <option value="">Select month…</option>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={String(idx + 1)}>{m}</option>
                ))}
              </select>
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 100 }}>Day</span>
              <input className="ds-input ds-flex-1" type="number" min="1" max="31" placeholder="e.g. 14"
                value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} />
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 100 }}>Notes</span>
              <input className="ds-input ds-flex-1" placeholder="Optional"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {err && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--coral)', margin: 0 }}>{err}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="ds-btn ds-btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Add birthday'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 48 }}>Loading…</p>
      ) : entries.length === 0 ? (
        <div className="ds-card ds-card--padded ds-card--dashed" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
            No birthdays added yet. Add one to set a monthly budget.
          </p>
        </div>
      ) : (
        <div className="ds-col" style={{ gap: 16 }}>
          {sortedMonths.map(monthNum => {
            const monthEntries = byMonth[monthNum]
            const monthTotal   = monthEntries.reduce((s, e) => s + (e.budget || 0), 0)
            const label        = monthNum > 0 ? MONTH_NAMES[monthNum - 1] : 'No month set'
            return (
              <div key={monthNum} className="ds-card">
                {/* Month header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px', borderBottom: '1px solid var(--border)',
                }}>
                  <span className="ds-label">{label}</span>
                  <span style={{
                    fontSize: 'var(--text-sm)', fontWeight: 700, color: '#5B3D7A',
                  }}>
                    {fmtBudget(monthTotal)} budget
                  </span>
                </div>

                {/* Birthday rows */}
                {monthEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    onMouseEnter={() => setHoveredId(entry.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 20px',
                      borderBottom: i < monthEntries.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {/* Birthday cake dot */}
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--lavender)',
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        {entry.name}
                      </span>
                      {entry.day != null && (
                        <span style={{ marginLeft: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {entry.day}{ordinal(entry.day)}
                        </span>
                      )}
                      {entry.notes && (
                        <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                          {entry.notes}
                        </span>
                      )}
                    </div>

                    <span style={{
                      fontWeight: 700, fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)', flexShrink: 0,
                    }}>
                      {fmtBudget(entry.budget)}
                    </span>

                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      style={{
                        flexShrink: 0, background: 'none', border: 'none',
                        cursor: deletingId === entry.id ? 'wait' : 'pointer',
                        padding: '2px 4px', borderRadius: 'var(--radius-sm)',
                        color: 'var(--coral)', fontSize: 13, lineHeight: 1,
                        opacity: hoveredId === entry.id ? 1 : 0,
                        transition: 'opacity 120ms var(--ease)',
                        pointerEvents: hoveredId === entry.id ? 'auto' : 'none',
                      }}
                      aria-label="Remove"
                    >
                      {deletingId === entry.id ? '…' : '✕'}
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ── How it works callout ── */}
      {!loading && (
        <div style={{
          marginTop: 24, padding: '14px 18px',
          background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.6,
        }}>
          The <strong style={{ color: 'var(--text-secondary)' }}>Birthdays</strong> budget on the Ledger is calculated
          from this table — the limit shown for each month is the sum of birthday budgets scheduled in that month,
          not a fixed limit. Months with no birthdays show $0.
        </div>
      )}
    </div>
  )
}
