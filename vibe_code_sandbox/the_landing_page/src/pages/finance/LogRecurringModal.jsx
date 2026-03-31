import { useState } from 'react'

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function fmtAmount(n) {
  if (n == null) return '—'
  return `$${Number(n).toFixed(2)}`
}

function Dot({ direction }) {
  const bg = direction === 'Income' ? 'var(--green)' : 'var(--coral)'
  return (
    <span style={{
      display: 'inline-block', flexShrink: 0,
      width: 7, height: 7, borderRadius: '50%', background: bg,
    }} />
  )
}

export default function LogRecurringModal({ items = [], onClose, onDone }) {
  const [month,       setMonth]       = useState(currentMonthKey)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [logging,     setLogging]     = useState(false)
  const [done,        setDone]        = useState(false)
  const [loggedCount, setLoggedCount] = useState(0)

  function toggle(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function logIds(ids) {
    if (!ids.length) return
    setLogging(true)
    try {
      await Promise.all(ids.map(id =>
        fetch(`/api/finance/recurring/${id}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month }),
        })
      ))
      setLoggedCount(ids.length)
      setDone(true)
      setTimeout(() => onDone?.(ids.length), 1600)
    } catch (err) {
      alert(`Logging failed: ${err.message}`)
      setLogging(false)
    }
  }

  return (
    <div className="ds-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal" style={{ maxWidth: 700 }}>
        <div className="ds-modal__header">
          <h2 className="ds-heading" style={{ fontSize: 'var(--text-lg)' }}>Log recurring items</h2>
          <button className="ds-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {done ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
              background: 'var(--green)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>✓</div>
            <p style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)', margin: '0 0 6px' }}>
              {loggedCount} item{loggedCount !== 1 ? 's' : ''} logged
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
              Transactions added to your ledger.
            </p>
          </div>
        ) : (
          <>
            <div className="ds-modal__body" style={{ padding: 0 }}>

              {/* Month + select controls */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderBottom: '1px solid var(--border)', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    Log for
                  </span>
                  <input
                    type="month"
                    className="ds-input"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    style={{ width: 148, padding: '5px 10px', fontSize: 'var(--text-xs)' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setSelectedIds(new Set(items.map(i => i.id)))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 6px' }}
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', padding: '4px 6px' }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Items */}
              {items.length === 0 ? (
                <p style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                  No recurring items found.
                </p>
              ) : (
                items.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                      borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      background: selectedIds.has(item.id) ? 'var(--bg-sunken)' : 'transparent',
                      transition: 'background 80ms ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggle(item.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ width: 14, height: 14, flexShrink: 0, accentColor: 'var(--green)', cursor: 'pointer' }}
                    />
                    <Dot direction={item.direction} />
                    <span style={{
                      flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600,
                      color: 'var(--text-primary)', minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </span>
                    {item.category && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        {item.category}
                      </span>
                    )}
                    <span style={{
                      fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0, minWidth: 48, textAlign: 'right',
                      color: item.direction === 'Income' ? 'var(--green)' : 'var(--coral)',
                    }}>
                      {fmtAmount(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="ds-modal__footer">
              <button className="ds-btn ds-btn--ghost" onClick={onClose} disabled={logging}>
                Cancel
              </button>
              <button
                className="ds-btn ds-btn--outline"
                disabled={logging || selectedIds.size === 0}
                onClick={() => logIds([...selectedIds])}
              >
                {logging ? 'Logging…' : `Log selected${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
              </button>
              <button
                className="ds-btn ds-btn--primary"
                disabled={logging || items.length === 0}
                onClick={() => logIds(items.map(i => i.id))}
              >
                {logging ? 'Logging…' : 'Log all'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
