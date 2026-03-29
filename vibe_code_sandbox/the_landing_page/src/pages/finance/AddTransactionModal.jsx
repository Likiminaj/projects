import { useState } from 'react'
import NotionSelect from '../../components/NotionSelect.jsx'

const TODAY = new Date().toISOString().split('T')[0]

const EMPTY_EXPENSE = {
  direction: 'Expense',
  title: '',
  merchant: '',
  amount: '',
  date: TODAY,
  category: '',
  source: '',
  notes: '',
  isPendingMatcha: false,
}

const EMPTY_INCOME = {
  direction: 'Income',
  sourceName: '',
  amount: '',
  date: TODAY,
  notes: '',
}

export default function AddTransactionModal({ onClose, onSaved, categories, sources, onSourceAdded, onSourceDeleted }) {
  const [direction, setDirection] = useState('Expense')
  const [expense, setExpense]     = useState(EMPTY_EXPENSE)
  const [income, setIncome]       = useState(EMPTY_INCOME)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)

  const [showRecurring, setShowRecurring]   = useState(false)
  const [recurringItems, setRecurringItems] = useState(null)

  function switchDirection(dir) {
    setDirection(dir)
    setError(null)
    setShowRecurring(false)
  }

  async function openRecurringPicker() {
    setShowRecurring(true)
    if (recurringItems !== null) return
    const res  = await fetch('/api/finance/recurring')
    const json = await res.json()
    setRecurringItems(json.success ? json.data.filter(i => i.direction === 'Income') : [])
  }

  function applyRecurring(item) {
    setIncome(f => ({
      ...f,
      sourceName: item.name,
      amount:     item.amount != null ? String(item.amount) : '',
    }))
    setShowRecurring(false)
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
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
      .catch(err => setError(`Sync failed for ${type}: ${err.message}`))
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
      .catch(err => setError(`Sync failed for ${type}: ${err.message}`))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const body = direction === 'Expense'
      ? {
          title:           expense.title || expense.merchant,
          merchant:        expense.merchant,
          amount:          parseFloat(expense.amount),
          date:            expense.date,
          direction:       'Expense',
          category:        expense.category,
          source:          expense.source,
          notes:           expense.notes,
          isPendingMatcha: expense.isPendingMatcha,
        }
      : {
          title:     income.sourceName,
          merchant:  '',
          amount:    parseFloat(income.amount),
          date:      income.date,
          direction: 'Income',
          notes:     income.notes,
        }

    try {
      const res  = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onSaved(json.data)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isExpense = direction === 'Expense'

  return (
    <div className="ds-modal-backdrop" onMouseDown={handleBackdrop}>
      <div className="ds-modal">

        <div className="ds-modal__header">
          <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>New Transaction</h2>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form id="add-tx-form" onSubmit={handleSubmit}>
          <div className="ds-modal__body">

            <div className="ds-toggle" style={{ marginBottom: 4 }}>
              <button
                type="button"
                className={`ds-toggle-btn ds-toggle-btn--expense${isExpense ? ' ds-toggle-btn--active' : ''}`}
                onClick={() => switchDirection('Expense')}
              >
                Expense
              </button>
              <button
                type="button"
                className={`ds-toggle-btn ds-toggle-btn--income${!isExpense ? ' ds-toggle-btn--active' : ''}`}
                onClick={() => switchDirection('Income')}
              >
                Income
              </button>
            </div>

            {/* ── Expense fields ── */}
            {isExpense && <>
              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Title</span>
                <input
                  className="ds-input ds-flex-1"
                  required
                  placeholder="e.g. Lunch, Monthly subscription"
                  value={expense.title}
                  onChange={e => setExpense(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Merchant</span>
                <input
                  className="ds-input ds-flex-1"
                  placeholder="e.g. Koufu, Grab, Netflix"
                  value={expense.merchant}
                  onChange={e => setExpense(f => ({ ...f, merchant: e.target.value }))}
                />
              </div>

              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Amount</span>
                <div className="ds-flex-1" style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)',
                    pointerEvents: 'none',
                  }}>$</span>
                  <input
                    className="ds-input"
                    style={{ paddingLeft: 26, width: '100%' }}
                    type="number" min="0" step="0.01" required placeholder="0.00"
                    value={expense.amount}
                    onChange={e => setExpense(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Date</span>
                <input
                  className="ds-input ds-flex-1"
                  type="date" required
                  value={expense.date}
                  onChange={e => setExpense(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div className="ds-field-row" style={{ alignItems: 'flex-start' }}>
                <span className="ds-field-label" style={{ width: 110, paddingTop: 11 }}>Category</span>
                <div className="ds-flex-1">
                  <NotionSelect
                    value={expense.category}
                    options={categories}
                    placeholder="Select or create…"
                    onChange={name => setExpense(f => ({ ...f, category: name ?? '' }))}
                  />
                </div>
              </div>

              <div className="ds-field-row" style={{ alignItems: 'flex-start' }}>
                <span className="ds-field-label" style={{ width: 110, paddingTop: 11 }}>Source</span>
                <div className="ds-flex-1">
                  <NotionSelect
                    value={expense.source}
                    options={sources}
                    placeholder="Select or create…"
                    onChange={name => setExpense(f => ({ ...f, source: name ?? '' }))}
                    onCreateNew={name => createOption('source', name, onSourceAdded)}
                    onDeleteOption={name => deleteOption('source', name, onSourceDeleted)}
                  />
                </div>
              </div>

              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Notes</span>
                <input
                  className="ds-input ds-flex-1"
                  placeholder="Optional"
                  value={expense.notes}
                  onChange={e => setExpense(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={expense.isPendingMatcha}
                    onChange={e => setExpense(f => ({ ...f, isPendingMatcha: e.target.checked }))}
                    style={{ width: 15, height: 15, accentColor: 'var(--green)', cursor: 'pointer' }}
                  />
                  Flag as Pending Matcha
                </label>
              </div>
            </>}

            {/* ── Income fields ── */}
            {!isExpense && <>
              <div className="ds-field-row" style={{ alignItems: 'flex-start' }}>
                <span className="ds-field-label" style={{ width: 110, paddingTop: 10 }}>Source</span>
                <div className="ds-col ds-flex-1" style={{ gap: 6 }}>
                  <input
                    className="ds-input"
                    required
                    placeholder="e.g. Employer, Pending Matcha payout"
                    value={income.sourceName}
                    onChange={e => setIncome(f => ({ ...f, sourceName: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={openRecurringPicker}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
                      fontWeight: 600, padding: 0, textDecoration: 'underline',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    ↩ Use a recurring source
                  </button>

                  {showRecurring && (
                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-md)',
                      overflow: 'hidden',
                      animation: 'ds-slide-up 140ms var(--ease)',
                    }}>
                      {recurringItems === null ? (
                        <p style={{ padding: '12px 14px', margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Loading…</p>
                      ) : recurringItems.length === 0 ? (
                        <p style={{ padding: '12px 14px', margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No recurring income sources saved yet.</p>
                      ) : recurringItems.map((item, i) => (
                        <div
                          key={item.id}
                          onClick={() => applyRecurring(item)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: i < recurringItems.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ flex: 1, fontWeight: 600, fontSize: 'var(--text-sm)' }}>{item.name}</span>
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--green)', fontWeight: 700 }}>
                            {item.amount != null ? `$${Number(item.amount).toFixed(2)}` : '—'}
                          </span>
                          <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>{item.frequency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Amount</span>
                <div className="ds-flex-1" style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)',
                    pointerEvents: 'none',
                  }}>$</span>
                  <input
                    className="ds-input"
                    style={{ paddingLeft: 26, width: '100%' }}
                    type="number" min="0" step="0.01" required placeholder="0.00"
                    value={income.amount}
                    onChange={e => setIncome(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Date</span>
                <input
                  className="ds-input ds-flex-1"
                  type="date" required
                  value={income.date}
                  onChange={e => setIncome(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div className="ds-field-row">
                <span className="ds-field-label" style={{ width: 110 }}>Notes</span>
                <input
                  className="ds-input ds-flex-1"
                  placeholder="Optional"
                  value={income.notes}
                  onChange={e => setIncome(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </>}

            {error && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--coral)', margin: 0 }}>{error}</p>
            )}
          </div>
        </form>

        <div className="ds-modal__footer">
          <button type="button" className="ds-btn ds-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="add-tx-form" disabled={submitting} className="ds-btn ds-btn--primary">
            {submitting ? 'Saving…' : `Save ${direction}`}
          </button>
        </div>

      </div>
    </div>
  )
}
