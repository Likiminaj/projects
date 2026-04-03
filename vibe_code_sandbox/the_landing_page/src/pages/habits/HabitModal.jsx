import { useState } from 'react'

const CATEGORIES = ['Health', 'Work', 'Personal', 'Learning', 'Finance', 'Social', 'Mindfulness']
const CADENCE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function today() {
  return new Date().toISOString().slice(0, 10)
}

const BLANK = {
  name: '', category: 'Health', type: 'Binary',
  targetValue: '', targetUnit: '',
  cadence: 'Daily', cadenceDays: [],
  startDate: today(), endDate: '',
  importance: 3, notes: '',
}

export default function HabitModal({ habit, onClose, onSaved }) {
  const isEdit = !!habit
  const [form, setForm] = useState(() => isEdit ? {
    ...BLANK,
    ...habit,
    targetValue: habit.targetValue ?? '',
    endDate:     habit.endDate    ?? '',
  } : BLANK)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function toggleDay(day) {
    setForm(f => ({
      ...f,
      cadenceDays: f.cadenceDays.includes(day)
        ? f.cadenceDays.filter(d => d !== day)
        : [...f.cadenceDays, day],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required')
    if (form.cadence === 'Custom' && form.cadenceDays.length === 0)
      return setError('Select at least one day for Custom cadence')

    setSaving(true); setError(null)
    try {
      const body = {
        name:        form.name.trim(),
        category:    form.category,
        type:        form.type,
        targetValue: form.type === 'Quantitative' && form.targetValue !== ''
          ? Number(form.targetValue) : null,
        targetUnit:  form.type === 'Quantitative' ? form.targetUnit.trim() : '',
        cadence:     form.cadence,
        cadenceDays: form.cadence === 'Custom' ? form.cadenceDays : [],
        startDate:   form.startDate || today(),
        endDate:     form.endDate   || null,
        importance:  Number(form.importance),
        notes:       form.notes.trim(),
      }
      const url    = isEdit ? `/api/habits/${habit.id}` : '/api/habits'
      const method = isEdit ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onSaved(json.data, isEdit)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal" style={{ maxWidth: 520 }}>
        <div className="ds-modal__header">
          <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>
            {isEdit ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="ds-modal__body" style={{ gap: 16 }} onSubmit={handleSubmit}>
          {/* Name */}
          <div>
            <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>Name</label>
            <input className="ds-input" value={form.name}
              onChange={e => set('name', e.target.value)} placeholder="e.g. Morning run" autoFocus />
          </div>

          {/* Category + Importance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>Category</label>
              <select className="ds-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>Priority</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => set('importance', n)} style={{
                    width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: form.importance >= n ? 'var(--amber)' : 'var(--bg-sunken)',
                    fontSize: 10, fontWeight: 700,
                    color: form.importance >= n ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    transition: 'background 120ms',
                  }}>{n}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Binary', 'Quantitative'].map(t => (
                <button key={t} type="button" onClick={() => set('type', t)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${form.type === t ? 'var(--amber)' : 'var(--border)'}`,
                  background: form.type === t ? 'var(--amber-light)' : 'var(--bg-sunken)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  fontWeight: form.type === t ? 700 : 500, fontSize: 'var(--text-sm)',
                  transition: 'all 120ms',
                }}>
                  {t === 'Binary' ? '✓ Binary (done/not done)' : '# Quantitative (value)'}
                </button>
              ))}
            </div>
          </div>

          {/* Target (quantitative only) */}
          {form.type === 'Quantitative' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>Target Value</label>
                <input className="ds-input" type="number" min="0" value={form.targetValue}
                  onChange={e => set('targetValue', e.target.value)} placeholder="e.g. 10000" />
              </div>
              <div>
                <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>Unit</label>
                <input className="ds-input" value={form.targetUnit}
                  onChange={e => set('targetUnit', e.target.value)} placeholder="e.g. steps, pages" />
              </div>
            </div>
          )}

          {/* Cadence */}
          <div>
            <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>Cadence</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: form.cadence === 'Custom' ? 10 : 0 }}>
              {['Daily', 'Weekly', 'Custom'].map(c => (
                <button key={c} type="button" onClick={() => set('cadence', c)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${form.cadence === c ? 'var(--amber)' : 'var(--border)'}`,
                  background: form.cadence === c ? 'var(--amber-light)' : 'var(--bg-sunken)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  fontWeight: form.cadence === c ? 700 : 500, fontSize: 'var(--text-sm)',
                  transition: 'all 120ms',
                }}>{c}</button>
              ))}
            </div>
            {form.cadence === 'Custom' && (
              <div style={{ display: 'flex', gap: 6 }}>
                {CADENCE_DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                    flex: 1, padding: '6px 0', borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${form.cadenceDays.includes(day) ? 'var(--green)' : 'var(--border)'}`,
                    background: form.cadenceDays.includes(day) ? 'var(--green-light)' : 'var(--bg-sunken)',
                    cursor: 'pointer', fontSize: 9, fontWeight: 700,
                    color: form.cadenceDays.includes(day) ? '#1e5c1b' : 'var(--text-tertiary)',
                    transition: 'all 120ms',
                  }}>{day}</button>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>Start Date</label>
              <input className="ds-input" type="date" value={form.startDate}
                onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>End Date <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span></label>
              <input className="ds-input" type="date" value={form.endDate}
                onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="ds-label" style={{ display: 'block', marginBottom: 6 }}>Notes <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span></label>
            <textarea className="ds-input" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Motivation, context…"
              style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {error && (
            <p style={{ color: 'var(--coral)', fontSize: 'var(--text-sm)', margin: 0 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" className="ds-btn ds-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ds-btn ds-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
