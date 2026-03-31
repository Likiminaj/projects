import { useEffect, useState } from 'react'

function fmtMoney(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function isLiability(account) {
  if (account.role) return account.role === 'liability'
  const value = `${account.name ?? ''} ${account.type ?? ''}`.toLowerCase()
  return /credit card|card|loan|debt|mortgage|liability/.test(value)
}

function isCash(account) {
  const value = `${account.name ?? ''} ${account.type ?? ''}`.toLowerCase()
  return /checking|savings|cash/.test(value)
}

export default function RecordCardPaymentModal({ accounts = [], onClose, onPaid }) {
  const cashAccounts = accounts.filter(isCash).filter(a => !isLiability(a))
  const cardAccounts = accounts.filter(isLiability)

  const [fromAccountId, setFromAccountId] = useState(cashAccounts[0]?.id ?? '')
  const [cardAccountId, setCardAccountId] = useState(cardAccounts[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!fromAccountId && cashAccounts[0]) setFromAccountId(cashAccounts[0].id)
    if (!cardAccountId && cardAccounts[0]) setCardAccountId(cardAccounts[0].id)
  }, [cashAccounts, cardAccounts, fromAccountId, cardAccountId])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/finance/accounts/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId,
          liabilityAccountId: cardAccountId,
          amount: parseFloat(amount),
          date,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onPaid?.(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal" style={{ maxWidth: 560 }}>
        <div className="ds-modal__header">
          <div>
            <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>Record card payment</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
              Moves cash to card debt without counting as spending.
            </p>
          </div>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ds-modal__body">
            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 120 }}>From</span>
              <select className="ds-input ds-flex-1" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)}>
                <option value="">Select account…</option>
                {cashAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {fmtMoney(account.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 120 }}>Card</span>
              <select className="ds-input ds-flex-1" value={cardAccountId} onChange={e => setCardAccountId(e.target.value)}>
                <option value="">Select card…</option>
                {cardAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} · Owed {fmtMoney(account.balance)}{account.creditLimit ? ` / ${fmtMoney(account.creditLimit)}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 120 }}>Amount</span>
              <div className="ds-flex-1" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none' }}>$</span>
                <input
                  className="ds-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  style={{ paddingLeft: 26 }}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="ds-field-row">
              <span className="ds-field-label" style={{ width: 120 }}>Date</span>
              <input className="ds-input ds-flex-1" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {error && <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--coral)' }}>{error}</p>}
          </div>

          <div className="ds-modal__footer">
            <button type="button" className="ds-btn ds-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="ds-btn ds-btn--primary" disabled={saving || !fromAccountId || !cardAccountId}>
              {saving ? 'Saving…' : 'Apply payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
