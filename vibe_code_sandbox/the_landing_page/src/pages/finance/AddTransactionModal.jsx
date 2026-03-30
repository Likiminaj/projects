import { useRef, useState } from 'react'
import NotionSelect from '../../components/NotionSelect.jsx'
import { extractTextFromImage, extractTextFromPDF, parseTransactions } from '../../lib/parseReceipt.js'

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
  bucketId: '',
}

const EMPTY_INCOME = {
  direction: 'Income',
  sourceName: '',
  amount: '',
  date: TODAY,
  notes: '',
}

// ── Inline styles ────────────────────────────────────────────────
const TH = {
  padding: '10px 12px', fontSize: 'var(--text-xs)', fontWeight: 700,
  color: 'var(--text-tertiary)', textAlign: 'left',
  borderBottom: '1.5px solid var(--border)', whiteSpace: 'nowrap',
}
const TD = { padding: '8px 8px', verticalAlign: 'middle' }

const CELL_INPUT = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)',
  background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', outline: 'none',
  color: 'var(--text-primary)', padding: '8px 10px',
}

export default function AddTransactionModal({ onClose, onSaved, onBulkSaved, categories, sources, buckets = [], onSourceAdded, onSourceDeleted }) {
  const [direction, setDirection] = useState('Expense')
  const [expense, setExpense]     = useState(EMPTY_EXPENSE)
  const [income, setIncome]       = useState(EMPTY_INCOME)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)

  const [showRecurring, setShowRecurring]   = useState(false)
  const [recurringItems, setRecurringItems] = useState(null)

  // Upload / review state
  const fileInputRef                    = useRef(null)
  const [uploadState, setUploadState]   = useState('idle') // 'idle' | 'parsing' | 'review'
  const [parsedRows, setParsedRows]     = useState([])
  const [rawOcrText, setRawOcrText]     = useState('')
  const [showRawText, setShowRawText]   = useState(false)
  const [addingProgress, setAddingProgress] = useState(null) // { current, total }
  const [successMsg, setSuccessMsg]     = useState('')

  // ── Upload handler ────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return }

    setError(null)
    setUploadState('parsing')
    try {
      const text = file.type === 'application/pdf'
        ? await extractTextFromPDF(file)
        : await extractTextFromImage(file)

      const rows = parseTransactions(text)
      setRawOcrText(text)
      setParsedRows(rows.map((r, i) => ({ ...r, _id: i })))
      setUploadState('review')
    } catch (err) {
      setError(`Parse failed: ${err.message}`)
      setUploadState('idle')
    } finally {
      // reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function updateRow(idx, patch) {
    setParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  function removeRow(idx) {
    setParsedRows(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleBulkAdd() {
    const invalid = parsedRows.filter(r => !r.merchant?.trim() || r.amount == null || r.amount === '')
    if (invalid.length > 0) {
      setError(`${invalid.length} row(s) are missing a merchant or amount.`)
      return
    }
    setError(null)
    setAddingProgress({ current: 0, total: parsedRows.length })
    const failed = []

    for (let i = 0; i < parsedRows.length; i++) {
      const r = parsedRows[i]
      setAddingProgress({ current: i + 1, total: parsedRows.length })
      try {
        const res = await fetch('/api/finance/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:           r.merchant,
            merchant:        r.merchant,
            amount:          parseFloat(r.amount),
            date:            r.date,
            direction:       r.direction,
            category:        r.category || '',
            source:          'Other',
            notes:           '',
            isPendingMatcha: false,
          }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        onSaved(json.data)
      } catch (err) {
        failed.push({ ...r, _err: err.message })
      }
    }

    setAddingProgress(null)
    if (failed.length === 0) {
      onBulkSaved?.()
      onClose()
    } else {
      setParsedRows(failed)
      setError(`${failed.length} transaction(s) failed — shown below. Fix and retry.`)
    }
  }

  function cancelReview() {
    setUploadState('idle')
    setParsedRows([])
    setRawOcrText('')
    setShowRawText(false)
    setError(null)
  }

  // ── Normal form helpers ────────────────────────────────────────
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
          isBucketSpend:   !!expense.bucketId,
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
      onSaved(json.data, expense.bucketId || null)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isExpense = direction === 'Expense'

  // ── Upload button (shown in all states except 'parsing') ──────
  const uploadBtn = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: '100%', padding: '11px', borderRadius: 'var(--radius-md)',
          border: '1.5px dashed var(--border-dashed)',
          background: 'var(--bg-sunken)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)',
          fontWeight: 600, color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'border-color 180ms var(--ease), background 180ms var(--ease)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.background = 'var(--amber-light)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dashed)'; e.currentTarget.style.background = 'var(--bg-sunken)' }}
      >
        ↑ Upload statement or receipt
      </button>
    </>
  )

  return (
    <div className="ds-modal-backdrop" onMouseDown={handleBackdrop}>
      <div className="ds-modal" style={{ maxWidth: uploadState === 'review' ? 760 : 520 }}>

        <div className="ds-modal__header">
          <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>
            {uploadState === 'review' ? 'Review Transactions' : 'New Transaction'}
          </h2>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Parsing state ── */}
        {uploadState === 'parsing' && (
          <div className="ds-modal__body" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Reading file…
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 6 }}>
              This may take a moment for images
            </p>
          </div>
        )}

        {/* ── Review table ── */}
        {uploadState === 'review' && (
          <div className="ds-modal__body">
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
              {parsedRows.length} transaction{parsedRows.length !== 1 ? 's' : ''} found — review and edit before adding
            </p>

            {parsedRows.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                No transactions could be parsed. Check the raw text below.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Merchant</th>
                      <th style={TH}>Amount</th>
                      <th style={TH}>Date</th>
                      <th style={TH}>Category</th>
                      <th style={TH}>Dir</th>
                      <th style={{ ...TH, width: 28 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => {
                      const missing = !row.merchant?.trim() || row.amount == null || row.amount === ''
                      return (
                        <tr
                          key={row._id ?? idx}
                          style={{ background: missing ? 'var(--amber-light)' : idx % 2 === 0 ? 'transparent' : 'var(--bg-sunken)' }}
                        >
                          <td style={TD}>
                            <input
                              value={row.merchant}
                              onChange={e => updateRow(idx, { merchant: e.target.value })}
                              style={{ ...CELL_INPUT, width: '100%', minWidth: 120 }}
                            />
                          </td>
                          <td style={TD}>
                            <input
                              type="number" min="0" step="0.01"
                              value={row.amount ?? ''}
                              onChange={e => updateRow(idx, { amount: e.target.value })}
                              style={{ ...CELL_INPUT, width: 90 }}
                            />
                          </td>
                          <td style={TD}>
                            <input
                              type="date"
                              value={row.date}
                              onChange={e => updateRow(idx, { date: e.target.value })}
                              style={{ ...CELL_INPUT, colorScheme: 'light' }}
                            />
                          </td>
                          <td style={TD}>
                            {row.direction !== 'Income' ? (
                              <select
                                value={row.category}
                                onChange={e => updateRow(idx, { category: e.target.value })}
                                style={{
                                  ...CELL_INPUT, minWidth: 130,
                                  color: row.category ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                }}
                              >
                                <option value="">— none —</option>
                                {categories.map(c => (
                                  <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>—</span>
                            )}
                          </td>
                          <td style={TD}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => updateRow(idx, { direction: 'Expense' })}
                                style={{
                                  padding: '6px 10px', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
                                  borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--coral)',
                                  background: row.direction === 'Expense' ? 'var(--coral)' : 'transparent',
                                  color: row.direction === 'Expense' ? '#fff' : 'var(--coral)',
                                  fontFamily: 'var(--font-sans)',
                                }}
                              >Exp</button>
                              <button
                                type="button"
                                onClick={() => updateRow(idx, { direction: 'Income', category: '' })}
                                style={{
                                  padding: '6px 10px', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
                                  borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--green)',
                                  background: row.direction === 'Income' ? 'var(--green)' : 'transparent',
                                  color: row.direction === 'Income' ? '#fff' : 'var(--green)',
                                  fontFamily: 'var(--font-sans)',
                                }}
                              >Inc</button>
                            </div>
                          </td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
                                lineHeight: 1, padding: '4px 6px',
                              }}
                              aria-label="Remove row"
                            >✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {error && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--coral)', margin: 0, fontWeight: 600 }}>{error}</p>
            )}

            {addingProgress && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                Adding {addingProgress.current} of {addingProgress.total}…
              </p>
            )}

            {/* Raw OCR toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowRawText(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
                  fontWeight: 600, padding: 0, fontFamily: 'var(--font-sans)',
                  textDecoration: 'underline',
                }}
              >
                {showRawText ? 'Hide' : 'Show'} raw OCR text
              </button>
              {showRawText && (
                <pre style={{
                  marginTop: 8, padding: '10px 12px',
                  background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)',
                  fontSize: 11, color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  maxHeight: 180, overflowY: 'auto', lineHeight: 1.5,
                }}>
                  {rawOcrText || '(empty)'}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* ── Normal form ── */}
        {uploadState === 'idle' && (
          <form id="add-tx-form" onSubmit={handleSubmit}>
            <div className="ds-modal__body">

              {uploadBtn}

              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => switchDirection('Expense')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 700,
                    border: '2px solid var(--coral)',
                    background: isExpense ? 'var(--coral)' : 'transparent',
                    color: isExpense ? '#fff' : 'var(--coral)',
                    transition: 'all 180ms var(--ease)',
                  }}
                >Expense</button>
                <button
                  type="button"
                  onClick={() => switchDirection('Income')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 700,
                    border: '2px solid var(--green)',
                    background: !isExpense ? 'var(--green)' : 'transparent',
                    color: !isExpense ? '#fff' : 'var(--green)',
                    transition: 'all 180ms var(--ease)',
                  }}
                >Income</button>
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

                {buckets.filter(b => b.status === 'Active' || b.status === 'Funded').length > 0 && (
                  <div className="ds-field-row">
                    <span className="ds-field-label" style={{ width: 110 }}>Bucket</span>
                    <select
                      className="ds-input ds-flex-1"
                      value={expense.bucketId}
                      onChange={e => setExpense(f => ({ ...f, bucketId: e.target.value }))}
                      style={{ color: expense.bucketId ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                    >
                      <option value="">— none —</option>
                      {buckets
                        .filter(b => b.status === 'Active' || b.status === 'Funded')
                        .map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} (${b.currentAmount.toFixed(0)} / ${b.targetAmount.toFixed(0)})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

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
        )}

        {/* ── Footer ── */}
        <div className="ds-modal__footer">
          {uploadState === 'review' ? (
            <>
              <button type="button" className="ds-btn ds-btn--ghost" onClick={cancelReview}>
                Cancel
              </button>
              <button
                type="button"
                className="ds-btn ds-btn--primary"
                onClick={handleBulkAdd}
                disabled={!!addingProgress || parsedRows.length === 0}
              >
                {addingProgress
                  ? `Adding ${addingProgress.current} of ${addingProgress.total}…`
                  : `Add all (${parsedRows.length})`}
              </button>
            </>
          ) : uploadState === 'idle' ? (
            <>
              <button type="button" className="ds-btn ds-btn--ghost" onClick={onClose}>Cancel</button>
              <button type="submit" form="add-tx-form" disabled={submitting} className="ds-btn ds-btn--primary">
                {submitting ? 'Saving…' : `Save ${direction}`}
              </button>
            </>
          ) : null}
        </div>

      </div>
    </div>
  )
}
