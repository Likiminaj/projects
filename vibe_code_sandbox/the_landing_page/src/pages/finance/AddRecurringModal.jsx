import { useState } from 'react'
import NotionSelect from '../../components/NotionSelect.jsx'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EMPTY_FORM = {
  direction:      'Expense',
  name:           '',
  merchant:       '',
  amount:         '',
  frequency:      'Monthly',
  yearlyMonth:    '',
  day:            '',
  category:       '',
  source:         '',
  notes:          '',
  isPendingMatcha: false,
  activeFrom:     '',
  activeUntil:    '',
}

function SegmentedControl({ value, options, onChange, accentColor }) {
  return (
    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
      {options.map(opt => {
        const active = value === opt
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{
            flex: 1, padding: '8px 12px', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 700,
            border: `1.5px solid ${active ? (accentColor ?? 'var(--text-primary)') : 'var(--border)'}`,
            background: active ? (accentColor ?? 'var(--text-primary)') : 'var(--bg-sunken)',
            color: active ? '#fff' : 'var(--text-secondary)',
            transition: 'all 150ms var(--ease)',
          }}>{opt}</button>
        )
      })}
    </div>
  )
}

export default function AddRecurringModal({ categories: initCats = [], sources: initSrcs = [], onClose, onSaved }) {
  const [form, setForm]   = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  // Local copies so new options are reflected immediately
  const [categories, setCategories] = useState(initCats)
  const [sources,    setSources]    = useState(initSrcs)

  const isExpense = form.direction === 'Expense'
  const isYearly  = form.frequency === 'Yearly'

  function createOption(type, name) {
    const opt = { name, color: 'default' }
    if (type === 'category') setCategories(p => [...p, opt])
    else                     setSources(p => [...p, opt])
    fetch('/api/finance/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name }),
    }).catch(() => {})
  }

  function deleteOption(type, name) {
    if (type === 'category') setCategories(p => p.filter(o => o.name !== name))
    else                     setSources(p => p.filter(o => o.name !== name))
    fetch('/api/finance/categories', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name }),
    }).catch(() => {})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const res  = await fetch('/api/finance/recurring', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount:      form.amount      ? parseFloat(form.amount)       : null,
          day:         form.day         ? parseInt(form.day, 10)         : null,
          yearlyMonth: form.yearlyMonth ? parseInt(form.yearlyMonth, 10) : null,
          activeFrom:  form.activeFrom  ? `${new Date().getFullYear()}-${String(form.activeFrom).padStart(2, '0')}`  : null,
          activeUntil: form.activeUntil ? `${new Date().getFullYear()}-${String(form.activeUntil).padStart(2, '0')}` : null,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onSaved(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal">
        <div className="ds-modal__header">
          <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>New recurring item</h2>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ds-modal__body">
          <form id="add-recurring-form" onSubmit={handleSubmit} className="ds-col ds-gap-3">

            {/* Direction */}
            <div className="ds-toggle" style={{ marginBottom: 4 }}>
              <button type="button"
                className={`ds-toggle-btn ds-toggle-btn--expense${isExpense ? ' ds-toggle-btn--active' : ''}`}
                onClick={() => setForm(f => ({ ...EMPTY_FORM, direction: 'Expense', frequency: f.frequency }))}>
                Expense
              </button>
              <button type="button"
                className={`ds-toggle-btn ds-toggle-btn--income${!isExpense ? ' ds-toggle-btn--active' : ''}`}
                onClick={() => setForm(f => ({ ...EMPTY_FORM, direction: 'Income', frequency: f.frequency }))}>
                Income
              </button>
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 110 }}>{isExpense ? 'Title' : 'Source'}</span>
              <input className="ds-input ds-flex-1" required
                placeholder={isExpense ? 'e.g. Netflix, Gym' : 'e.g. Employer'}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 110 }}>Merchant</span>
              <input className="ds-input ds-flex-1" placeholder="Optional"
                value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} />
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 110 }}>Amount</span>
              <div className="ds-flex-1" style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none',
                }}>$</span>
                <input className="ds-input" style={{ paddingLeft: 26, width: '100%' }}
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 110 }}>Frequency</span>
              <SegmentedControl
                value={form.frequency}
                options={['Monthly', 'Yearly']}
                onChange={freq => setForm(f => ({ ...f, frequency: freq, yearlyMonth: '', day: '' }))}
                accentColor="var(--sky)"
              />
            </div>

            {isYearly && (
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Month</span>
                <select
                  className="ds-input ds-flex-1"
                  value={form.yearlyMonth}
                  onChange={e => setForm(f => ({ ...f, yearlyMonth: e.target.value }))}
                  style={{ color: form.yearlyMonth ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                >
                  <option value="">Select month…</option>
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={String(idx + 1)}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 110 }}>
                Day <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(opt)</span>
              </span>
              <input className="ds-input ds-flex-1" type="number" min="1" max="31"
                placeholder="e.g. 1" value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value }))} />
            </div>

            {isExpense && (
              <>
                <div className="ds-field-row" style={{ alignItems: 'flex-start' }}>
                  <span className="ds-field-label" style={{ width: 110, paddingTop: 11 }}>Category</span>
                  <div className="ds-flex-1">
                    <NotionSelect value={form.category} options={categories} placeholder="Select category…"
                      onChange={name => setForm(f => ({ ...f, category: name ?? '' }))} />
                  </div>
                </div>
                <div className="ds-field-row" style={{ alignItems: 'flex-start' }}>
                  <span className="ds-field-label" style={{ width: 110, paddingTop: 11 }}>Source</span>
                  <div className="ds-flex-1">
                    <NotionSelect value={form.source} options={sources} placeholder="Select or create…"
                      onChange={name => setForm(f => ({ ...f, source: name ?? '' }))}
                      onCreateNew={name  => createOption('source', name)}
                      onDeleteOption={name => deleteOption('source', name)} />
                  </div>
                </div>
              </>
            )}

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 110 }}>Notes</span>
              <input className="ds-input ds-flex-1" placeholder="Optional"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 110 }}>
                Period <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(opt)</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <select
                  className="ds-input"
                  value={form.activeFrom}
                  onChange={e => setForm(f => ({ ...f, activeFrom: e.target.value }))}
                  style={{ flex: 1, color: form.activeFrom ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                >
                  <option value="">From…</option>
                  {MONTH_NAMES.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                </select>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>→</span>
                <select
                  className="ds-input"
                  value={form.activeUntil}
                  onChange={e => setForm(f => ({ ...f, activeUntil: e.target.value }))}
                  style={{ flex: 1, color: form.activeUntil ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                >
                  <option value="">Until…</option>
                  {MONTH_NAMES.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                </select>
              </div>
            </div>

            {isExpense && (
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.isPendingMatcha}
                    onChange={e => setForm(f => ({ ...f, isPendingMatcha: e.target.checked }))}
                    style={{ width: 14, height: 14, accentColor: 'var(--green)', cursor: 'pointer' }} />
                  Flag as Pending Matcha
                </label>
              </div>
            )}

            {error && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--coral)', margin: 0 }}>{error}</p>}
          </form>
        </div>

        <div className="ds-modal__footer">
          <button className="ds-btn ds-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="add-recurring-form" disabled={saving} className="ds-btn ds-btn--primary">
            {saving ? 'Saving…' : `Save ${form.direction}`}
          </button>
        </div>
      </div>
    </div>
  )
}
