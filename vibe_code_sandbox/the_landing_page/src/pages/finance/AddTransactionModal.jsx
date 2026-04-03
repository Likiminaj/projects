import { useRef, useState } from 'react'
import { extractTextFromImage, extractTextFromPDF, parseTransactions } from '../../lib/parseReceipt.js'

const TODAY = new Date().toISOString().split('T')[0]

const EMPTY_ROW = () => ({
  id: crypto.randomUUID(),
  direction: 'Expense',
  title: '',
  merchant: '',
  amount: '',
  date: TODAY,
  category: '',
  source: '',
  notes: '',
  isPendingMatcha: false,
})

const TH = {
  padding: '10px 12px', fontSize: 'var(--text-sm)', fontWeight: 700,
  color: 'var(--text-tertiary)', textAlign: 'left',
  borderBottom: '1.5px solid var(--border)', whiteSpace: 'nowrap',
}
const TD = { padding: '8px 8px', verticalAlign: 'middle' }

const CELL_INPUT = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)',
  background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', outline: 'none',
  color: 'var(--text-primary)', padding: '8px 10px',
}

function isBlankRow(row) {
  return !row.title?.trim() && !row.merchant?.trim() && !String(row.amount ?? '').trim() && !row.category && !row.source && !row.notes && !row.isPendingMatcha
}

function normalizeParsedRow(row) {
  return {
    ...EMPTY_ROW(),
    id: crypto.randomUUID(),
    title: row.title ?? '',
    merchant: row.merchant ?? '',
    amount: row.amount != null ? String(row.amount) : '',
    date: row.date || TODAY,
    direction: row.direction || 'Expense',
    category: row.category ?? '',
    source: row.source ?? '',
    notes: row.notes ?? '',
  }
}

export default function AddTransactionModal({ onClose, onSaved, onBulkSaved, categories, buckets = [] }) {
  const fileInputRef = useRef(null)

  const [rows, setRows] = useState([EMPTY_ROW()])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [addingProgress, setAddingProgress] = useState(null)
  const [rawOcrText, setRawOcrText] = useState('')
  const [showRawText, setShowRawText] = useState(false)

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  function updateRow(id, patch) {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows(prev => [...prev, EMPTY_ROW()])
  }

  function removeRow(id) {
    setRows(prev => (prev.length > 1 ? prev.filter(row => row.id !== id) : [EMPTY_ROW()]))
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setError(null)
    setIsParsing(true)

    const appended = []
    const rawParts = []
    const failed = []

    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          failed.push(`${file.name} (over 10 MB)`)
          continue
        }

        try {
          const text = file.type === 'application/pdf'
            ? await extractTextFromPDF(file)
            : await extractTextFromImage(file)

          rawParts.push(`--- ${file.name} ---\n${text}`)
          appended.push(...parseTransactions(text).map(normalizeParsedRow))
        } catch (err) {
          failed.push(`${file.name}: ${err.message}`)
        }
      }

      if (appended.length > 0) {
        setRows(prev => [...prev, ...appended])
      }

      if (rawParts.length > 0) {
        setRawOcrText(prev => (prev ? `${prev}\n\n${rawParts.join('\n\n')}` : rawParts.join('\n\n')))
      }

      if (failed.length > 0) {
        setError(`Could not parse ${failed.length} file(s): ${failed.join(', ')}`)
      }
    } finally {
      setIsParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const actionableRows = rows.filter(row => !isBlankRow(row))
    if (actionableRows.length === 0) {
      setError('Add at least one transaction.')
      setSubmitting(false)
      return
    }

    const invalid = actionableRows.filter(row => {
      const amount = parseFloat(row.amount)
      if (!amount || amount <= 0) return true
      if (row.direction === 'Income') return !row.title?.trim()
      return !row.merchant?.trim()
    })

    if (invalid.length > 0) {
      setError(`${invalid.length} row(s) are missing required fields.`)
      setSubmitting(false)
      return
    }

    setAddingProgress({ current: 0, total: actionableRows.length })
    const failed = []

    try {
      for (let i = 0; i < actionableRows.length; i++) {
        const row = actionableRows[i]
        setAddingProgress({ current: i + 1, total: actionableRows.length })

        const payload = row.direction === 'Income'
          ? {
              title: row.title || row.merchant,
              merchant: '',
              amount: parseFloat(row.amount),
              date: row.date,
              direction: 'Income',
              notes: row.notes || '',
            }
          : {
              title: row.title || row.merchant,
              merchant: row.merchant,
              amount: parseFloat(row.amount),
              date: row.date,
              direction: 'Expense',
              category: row.category || '',
              source: row.source || '',
              notes: row.notes || '',
              isPendingMatcha: row.isPendingMatcha,
            }

        try {
          const res = await fetch('/api/finance/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const json = await res.json()
          if (!json.success) throw new Error(json.error)
          onSaved(json.data, null)
        } catch (err) {
          failed.push({ ...row, _err: err.message })
        }
      }
    } finally {
      setAddingProgress(null)
      setSubmitting(false)
    }

    if (failed.length === 0) {
      onBulkSaved?.(actionableRows.length)
      onClose()
      return
    }

    setRows(failed)
    setError(`${failed.length} transaction(s) failed — fix the rows below and try again.`)
  }

  const uploadBtn = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isParsing}
        style={{
          width: '100%', padding: '11px', borderRadius: 'var(--radius-md)',
          border: '1.5px dashed var(--border-dashed)',
          background: 'var(--bg-sunken)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)',
          fontWeight: 600, color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'border-color 180ms var(--ease), background 180ms var(--ease)',
          opacity: isParsing ? 0.7 : 1,
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
      <div className="ds-modal" style={{ maxWidth: 980 }}>
        <div className="ds-modal__header">
          <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>Review Transactions</h2>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ds-modal__body">
          {uploadBtn}

          {isParsing && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, margin: '8px 0 0' }}>
              Reading file(s)…
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 12, marginBottom: 8 }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
              {rows.filter(r => !isBlankRow(r)).length} transaction{rows.filter(r => !isBlankRow(r)).length === 1 ? '' : 's'} ready
            </p>
            <button
              type="button"
              onClick={addRow}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
                fontWeight: 600, padding: 0, fontFamily: 'var(--font-sans)',
                textDecoration: 'underline',
              }}
            >
              + Add another transaction
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr>
                  <th style={TH}>Title</th>
                  <th style={TH}>Merchant</th>
                  <th style={TH}>Amount</th>
                  <th style={TH}>Date</th>
                  <th style={TH}>Category</th>
                  <th style={TH}>Dir</th>
                  <th style={{ ...TH, width: 56 }}>PM</th>
                  <th style={{ ...TH, width: 28 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const missing = row.direction === 'Income'
                    ? !row.title?.trim() || !row.amount || parseFloat(row.amount) <= 0
                    : !row.merchant?.trim() || !row.amount || parseFloat(row.amount) <= 0

                  return (
                    <tr
                      key={row.id}
                      style={{ background: missing ? 'var(--amber-light)' : idx % 2 === 0 ? 'transparent' : 'var(--bg-sunken)' }}
                    >
                      <td style={TD}>
                        <input
                          value={row.title}
                          onChange={e => updateRow(row.id, { title: e.target.value })}
                          style={{ ...CELL_INPUT, width: '100%', minWidth: 140 }}
                          placeholder="e.g. Lunch, Grab"
                        />
                      </td>
                      <td style={TD}>
                        <input
                          value={row.merchant}
                          onChange={e => updateRow(row.id, { merchant: e.target.value })}
                          style={{ ...CELL_INPUT, width: '100%', minWidth: 120 }}
                          placeholder={row.direction === 'Income' ? 'Optional' : ''}
                        />
                      </td>
                      <td style={TD}>
                        <input
                          type="number" min="0" step="0.01"
                          value={row.amount}
                          onChange={e => updateRow(row.id, { amount: e.target.value })}
                          style={{ ...CELL_INPUT, width: 90 }}
                        />
                      </td>
                      <td style={TD}>
                        <input
                          type="date"
                          value={row.date}
                          onChange={e => updateRow(row.id, { date: e.target.value })}
                          style={{ ...CELL_INPUT, colorScheme: 'light' }}
                        />
                      </td>
                      <td style={TD}>
                        {row.direction !== 'Income' ? (
                          <select
                            value={row.category}
                            onChange={e => updateRow(row.id, { category: e.target.value })}
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
                            onClick={() => updateRow(row.id, { direction: 'Expense' })}
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
                            onClick={() => updateRow(row.id, { direction: 'Income', category: '' })}
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
                      <td style={TD}>
                        {row.direction === 'Expense' ? (
                          <input
                            type="checkbox"
                            checked={row.isPendingMatcha}
                            onChange={e => updateRow(row.id, { isPendingMatcha: e.target.checked })}
                            style={{ width: 15, height: 15, accentColor: 'var(--green)', cursor: 'pointer' }}
                          />
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
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

          {addingProgress && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '8px 0 0' }}>
              Adding {addingProgress.current} of {addingProgress.total}…
            </p>
          )}

          {error && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--coral)', margin: '8px 0 0', fontWeight: 600 }}>{error}</p>
          )}

          <div style={{ marginTop: 12 }}>
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
                fontSize: 8, color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 180, overflowY: 'auto', lineHeight: 1.5,
              }}>
                {rawOcrText || '(empty)'}
              </pre>
            )}
          </div>
        </div>

        <div className="ds-modal__footer">
          <button type="button" className="ds-btn ds-btn--ghost" onClick={onClose} disabled={submitting || isParsing}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting || isParsing} className="ds-btn ds-btn--primary">
            {submitting ? 'Saving…' : `Add all (${rows.filter(r => !isBlankRow(r)).length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
