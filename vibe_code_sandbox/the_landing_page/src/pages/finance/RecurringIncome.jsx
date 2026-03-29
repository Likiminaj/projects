import { useEffect, useState } from 'react'
import NotionSelect from '../../components/NotionSelect.jsx'

const EMPTY_FORM = {
  direction: 'Expense',
  name: '',
  merchant: '',
  amount: '',
  frequency: 'Monthly',
  day: '',
  category: '',
  source: '',
  notes: '',
  isPendingMatcha: false,
}

const FREQUENCIES = ['Monthly', 'Irregular']

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function fmtAmount(amount) {
  if (amount === null || amount === undefined) return '—'
  return `$${Number(amount).toFixed(2)}`
}

function FrequencyPill({ frequency }) {
  const colors = {
    Monthly:   { bg: '#DDF0F8', text: '#1A5C8A' },
    Irregular: { bg: '#F0EBE3', text: '#78716C' },
  }
  const c = colors[frequency] ?? { bg: '#F0EBE3', text: '#78716C' }
  return (
    <span style={{
      background: c.bg, color: c.text,
      borderRadius: 999, padding: '2px 10px',
      fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {frequency ?? '—'}
    </span>
  )
}

function DirectionDot({ direction }) {
  const bg = direction === 'Income' ? 'var(--green)'
           : direction === 'Expense' ? 'var(--coral)'
           : 'var(--border)'
  return (
    <span style={{
      display: 'inline-block', flexShrink: 0,
      width: 7, height: 7, borderRadius: '50%',
      background: bg,
    }} />
  )
}

export default function RecurringIncome() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState('All')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState(null)
  const [options, setOptions]     = useState({ categories: [], sources: [] })


  // Delete
  const [hoveredId, setHoveredId]   = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Bulk log
  const [selectMode, setSelectMode]   = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkPanel, setBulkPanel]     = useState(null)   // null | 'all' | 'selected'
  const [bulkMonth, setBulkMonth]     = useState(currentMonthKey)
  const [bulkLogging, setBulkLogging] = useState(false)
  const [bulkDone, setBulkDone]       = useState(false)

  const { categories, sources } = options

  function patchOptions(key, updater) {
    setOptions(prev => ({ ...prev, [key]: updater(prev[key]) }))
  }

  function createOption(type, name, onAdded, parentCategory) {
    onAdded({ name, color: 'default', ...(parentCategory ? { category: parentCategory } : {}) })
    fetch('/api/finance/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, ...(parentCategory ? { parentCategory } : {}) }),
    })
      .then(r => r.json())
      .then(json => { if (!json.success) throw new Error(json.error) })
      .catch(err => setFormError(`Sync failed for ${type}: ${err.message}`))
  }

  function deleteOption(type, name, onDeleted) {
    onDeleted(name)
    fetch('/api/finance/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name }),
    })
      .then(r => r.json())
      .then(json => { if (!json.success) throw new Error(json.error) })
      .catch(err => setFormError(`Sync failed for ${type}: ${err.message}`))
  }

  async function fetchItems() {
    setLoading(true)
    try {
      const res  = await fetch('/api/finance/recurring')
      const json = await res.json()
      if (json.success) setItems(json.data)
    } finally {
      setLoading(false)
    }
  }

  async function fetchOptions() {
    try {
      const res  = await fetch('/api/finance/categories')
      const json = await res.json()
      if (json.success) setOptions(json.data)
    } catch {}
  }

  useEffect(() => { fetchItems(); fetchOptions() }, [])

  // ── Delete ───────────────────────────────────────────────────────
  async function handleDelete(id) {
    setDeletingId(id)
    try {
      const res  = await fetch(`/api/finance/recurring/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setItems(prev => prev.filter(i => i.id !== id))
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Bulk log ─────────────────────────────────────────────────────
  function openBulkPanel(mode) {
    setBulkPanel(mode)
    setBulkDone(false)
    setSelectedIds(new Set())
    setSelectMode(mode === 'selected')
  }

  function cancelBulk() {
    setBulkPanel(null)
    setSelectMode(false)
    setSelectedIds(new Set())
    setBulkDone(false)
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkLog() {
    const idsToLog = bulkPanel === 'all'
      ? visibleItems.map(i => i.id)
      : [...selectedIds]
    if (idsToLog.length === 0) return

    setBulkLogging(true)
    try {
      await Promise.all(idsToLog.map(id =>
        fetch(`/api/finance/recurring/${id}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: bulkMonth }),
        }).then(r => r.json())
      ))
      setBulkDone(true)
      setTimeout(() => cancelBulk(), 2000)
    } catch (err) {
      alert(`Bulk log failed: ${err.message}`)
    } finally {
      setBulkLogging(false)
    }
  }

  // ── Add form submit ───────────────────────────────────────────────
  async function handleAddSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const res = await fetch('/api/finance/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: form.amount ? parseFloat(form.amount) : null }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setItems(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const isExpense = form.direction === 'Expense'

  const monthlyIncome   = items.filter(i => i.direction === 'Income'  && i.frequency === 'Monthly' && i.amount != null).reduce((s, i) => s + i.amount, 0)
  const monthlyExpenses = items.filter(i => i.direction !== 'Income'  && i.frequency === 'Monthly' && i.amount != null).reduce((s, i) => s + i.amount, 0)
  const monthlyNet      = monthlyIncome - monthlyExpenses

  const visibleItems = items.filter(item => {
    if (tab === 'Income')  return item.direction === 'Income'
    if (tab === 'Expense') return item.direction === 'Expense' || item.direction === null
    return true
  })

  const DayField = form.frequency === 'Monthly' && (
    <div className="ds-field-row">
      <span className="ds-field-label" style={{ width: 110 }}>Day of month</span>
      <input
        className="ds-input ds-flex-1"
        type="number" min="1" max="31" placeholder="e.g. 16"
        value={form.day}
        onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
      />
    </div>
  )

  return (
    <div className="ds-page">
      <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="ds-heading" style={{ fontSize: 'var(--text-xl)' }}>Recurring</h1>
        <button
          className={`ds-btn ${showForm ? 'ds-btn--ghost' : 'ds-btn--primary'}`}
          onClick={() => { setShowForm(s => !s); cancelBulk() }}
        >
          {showForm ? '✕ Cancel' : '+ Add'}
        </button>
      </div>

      {/* ── Hero summary ── */}
      {!loading && items.length > 0 && (
        <div style={{
          background: 'var(--amber-light)',
          border: '1.5px solid var(--amber)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          marginBottom: 20,
        }}>
          <p className="ds-label" style={{ color: '#7a5000', marginBottom: 'var(--space-2)' }}>Monthly Recurring</p>
          <p style={{
            fontSize: 55, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
            color: 'var(--text-primary)', marginBottom: 'var(--space-3)',
          }}>
            −${monthlyExpenses.toFixed(2)}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.6)', border: '1.5px solid var(--green)',
              borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700,
              color: '#1e5c1b', padding: '4px 12px',
            }}>
              ↑ ${monthlyIncome.toFixed(2)} in
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.6)', border: '1.5px solid var(--coral)',
              borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700,
              color: '#9a2a1a', padding: '4px 12px',
            }}>
              ↓ ${monthlyExpenses.toFixed(2)} out
            </span>
            {monthlyNet !== 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.6)', border: `1.5px solid ${monthlyNet >= 0 ? 'var(--green)' : 'var(--coral)'}`,
                borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700,
                color: monthlyNet >= 0 ? '#1e5c1b' : '#9a2a1a', padding: '4px 12px',
              }}>
                {monthlyNet >= 0 ? '+' : ''}${monthlyNet.toFixed(2)} net
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Add form ── */}
      {showForm && (
        <div className="ds-card ds-card--padded" style={{ marginBottom: 20 }}>
          <p className="ds-label" style={{ marginBottom: 14 }}>New Recurring Item</p>
          <form onSubmit={handleAddSubmit} className="ds-col ds-gap-3">

            <div className="ds-toggle" style={{ marginBottom: 4 }}>
              <button type="button" className={`ds-toggle-btn ds-toggle-btn--expense${isExpense ? ' ds-toggle-btn--active' : ''}`} onClick={() => setForm(f => ({ ...EMPTY_FORM, direction: 'Expense', frequency: f.frequency }))}>Expense</button>
              <button type="button" className={`ds-toggle-btn ds-toggle-btn--income${!isExpense ? ' ds-toggle-btn--active' : ''}`} onClick={() => setForm(f => ({ ...EMPTY_FORM, direction: 'Income', frequency: f.frequency }))}>Income</button>
            </div>

            {isExpense && <>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Title</span>
                <input className="ds-input ds-flex-1" required placeholder="e.g. Monthly groceries, Netflix" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Merchant</span>
                <input className="ds-input ds-flex-1" placeholder="e.g. NTUC, Netflix" value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} />
              </div>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Amount</span>
                <div className="ds-flex-1" style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none' }}>$</span>
                  <input className="ds-input" style={{ paddingLeft: 26, width: '100%' }} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Frequency</span>
                <div className="ds-toggle ds-flex-1">
                  {FREQUENCIES.map(freq => (
                    <button key={freq} type="button" className={`ds-toggle-btn${form.frequency === freq ? ' ds-toggle-btn--active' : ''}`} onClick={() => setForm(f => ({ ...f, frequency: freq, day: '' }))}>{freq}</button>
                  ))}
                </div>
              </div>
              {DayField}
              <div className="ds-field-row" style={{ alignItems: 'flex-start' }}>
                <span className="ds-field-label" style={{ width: 110, paddingTop: 11 }}>Category</span>
                <div className="ds-flex-1">
                  <NotionSelect value={form.category} options={categories} placeholder="Select category…" onChange={name => setForm(f => ({ ...f, category: name ?? '' }))} />
                </div>
              </div>
              <div className="ds-field-row" style={{ alignItems: 'flex-start' }}>
                <span className="ds-field-label" style={{ width: 110, paddingTop: 11 }}>Source</span>
                <div className="ds-flex-1">
                  <NotionSelect value={form.source} options={sources} placeholder="Select or create…" onChange={name => setForm(f => ({ ...f, source: name ?? '' }))} onCreateNew={name => createOption('source', name, opt => patchOptions('sources', prev => [...prev, opt]))} onDeleteOption={name => deleteOption('source', name, n => patchOptions('sources', prev => prev.filter(o => o.name !== n)))} />
                </div>
              </div>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Notes</span>
                <input className="ds-input ds-flex-1" placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.isPendingMatcha} onChange={e => setForm(f => ({ ...f, isPendingMatcha: e.target.checked }))} style={{ width: 15, height: 15, accentColor: 'var(--green)', cursor: 'pointer' }} />
                  Flag as Pending Matcha
                </label>
              </div>
            </>}

            {!isExpense && <>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Source</span>
                <input className="ds-input ds-flex-1" required placeholder="e.g. Employer, Freelance" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Amount</span>
                <div className="ds-flex-1" style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none' }}>$</span>
                  <input className="ds-input" style={{ paddingLeft: 26, width: '100%' }} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Frequency</span>
                <div className="ds-toggle ds-flex-1">
                  {FREQUENCIES.map(freq => (
                    <button key={freq} type="button" className={`ds-toggle-btn${form.frequency === freq ? ' ds-toggle-btn--active' : ''}`} onClick={() => setForm(f => ({ ...f, frequency: freq, day: '' }))}>{freq}</button>
                  ))}
                </div>
              </div>
              {DayField}
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Notes</span>
                <input className="ds-input ds-flex-1" placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </>}

            {formError && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--coral)', margin: 0 }}>{formError}</p>}
            <div className="ds-row" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} className="ds-btn ds-btn--primary">{saving ? 'Saving…' : `Save ${form.direction}`}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter tabs + bulk actions ── */}
      <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div className="ds-row ds-gap-2">
          {['All', 'Income', 'Expense'].map(t => (
            <button
              key={t}
              className={`ds-chip${tab === t ? (t === 'Income' ? ' ds-chip--green-active' : t === 'Expense' ? ' ds-chip--coral-active' : ' ds-chip--active') : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {visibleItems.length > 0 && !showForm && (
          <div className="ds-row ds-gap-2">
            <button className="ds-btn ds-btn--outline ds-btn--sm" onClick={() => openBulkPanel('all')}>Log all</button>
            <button className="ds-btn ds-btn--outline ds-btn--sm" onClick={() => openBulkPanel('selected')}>Log selected</button>
          </div>
        )}
      </div>

      {/* ── Bulk log panel ── */}
      {bulkPanel && (
        <div className="ds-card ds-card--padded" style={{ marginBottom: 16 }}>
          <div className="ds-row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {bulkPanel === 'all'
                ? `Log all ${visibleItems.length} item${visibleItems.length !== 1 ? 's' : ''} for`
                : `Log ${selectedIds.size} selected item${selectedIds.size !== 1 ? 's' : ''} for`}
            </span>
            <input
              className="ds-input"
              type="month"
              value={bulkMonth}
              onChange={e => setBulkMonth(e.target.value)}
              style={{ width: 160 }}
            />
            <button
              className="ds-btn ds-btn--primary ds-btn--sm"
              disabled={bulkLogging || (bulkPanel === 'selected' && selectedIds.size === 0)}
              onClick={handleBulkLog}
              style={bulkDone ? { background: 'var(--green)', borderColor: 'var(--green)' } : {}}
            >
              {bulkLogging ? 'Logging…' : bulkDone ? '✓ Done' : 'Confirm'}
            </button>
            <button className="ds-btn ds-btn--ghost ds-btn--sm" onClick={cancelBulk}>Cancel</button>
          </div>
          {bulkPanel === 'selected' && selectedIds.size === 0 && (
            <p style={{ margin: '10px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Check the items below you want to log.
            </p>
          )}
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 48 }}>Loading…</p>
      ) : visibleItems.length === 0 ? (
        <div className="ds-card ds-card--padded ds-card--dashed" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No recurring items yet.</p>
        </div>
      ) : (
        <div className="ds-card">
          {visibleItems.map((item, i) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => selectMode && toggleSelect(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: i < visibleItems.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: selectMode ? 'pointer' : 'default',
                background: selectMode && selectedIds.has(item.id) ? 'var(--bg-sunken)' : 'transparent',
              }}
            >
              {/* Checkbox (select mode) */}
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 15, height: 15, flexShrink: 0, accentColor: 'var(--green)', cursor: 'pointer' }}
                />
              )}

              {!selectMode && <DirectionDot direction={item.direction} />}

              <div className="ds-col ds-flex-1" style={{ gap: 2 }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{item.name}</span>
                {(item.category || item.notes) && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {item.category}
                    {item.category && item.notes ? ' — ' : ''}
                    {item.notes}
                  </span>
                )}
              </div>

              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', minWidth: 72, textAlign: 'right', color: item.direction === 'Income' ? 'var(--green)' : item.direction === 'Expense' ? 'var(--coral)' : 'var(--text-secondary)' }}>
                {fmtAmount(item.amount)}
              </span>

              <FrequencyPill frequency={item.frequency} />

              {/* Delete button */}
              <button
                onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                disabled={deletingId === item.id}
                style={{
                  flexShrink: 0, background: 'none', border: 'none',
                  cursor: deletingId === item.id ? 'wait' : 'pointer',
                  padding: '2px 4px', borderRadius: 'var(--radius-sm)',
                  color: 'var(--coral)', fontSize: 17, lineHeight: 1,
                  opacity: hoveredId === item.id || selectMode ? 1 : 0,
                  transition: 'opacity 120ms var(--ease)',
                  pointerEvents: hoveredId === item.id || selectMode ? 'auto' : 'none',
                }}
                aria-label="Delete"
              >
                {deletingId === item.id ? '…' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
