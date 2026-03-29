import { useState, useRef, useEffect } from 'react'

// Maps Notion color names → design system token values
const PILL = {
  gray:    { bg: '#F0EBE3', text: '#78716C' },
  brown:   { bg: '#F5EDE8', text: '#7A4A35' },
  orange:  { bg: '#FDF0D0', text: '#8A5F00' },
  yellow:  { bg: '#FDF0D0', text: '#8A5F00' },
  green:   { bg: '#D6EDCF', text: '#1E5C1B' },
  blue:    { bg: '#DDF0F8', text: '#1A5C8A' },
  purple:  { bg: '#EDE5F5', text: '#5B3D7A' },
  pink:    { bg: '#FCE8F3', text: '#8A2C62' },
  red:     { bg: '#FAD9D5', text: '#9A2A1A' },
  default: { bg: '#F0EBE3', text: '#78716C' },
}

function pill(color) {
  return PILL[color] ?? PILL.default
}

// ── Pill chip (reused in trigger + list) ─────────────────────────
function Chip({ name, color, size = 'sm' }) {
  const c = pill(color)
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: c.bg,
      color: c.text,
      borderRadius: 999,
      padding: size === 'sm' ? '2px 10px' : '3px 12px',
      fontSize: size === 'sm' ? 12 : 13,
      fontWeight: 600,
      lineHeight: 1.5,
      whiteSpace: 'nowrap',
    }}>
      {name}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────
// Props:
//   value          – string | null
//   options        – { name, color }[]
//   placeholder    – string
//   onChange       – (name: string | null) => void
//   onCreateNew    – async (name: string) => void   (parent handles API + list update)
//   onDeleteOption – async (name: string) => void   (parent handles API + list update)
//   creating       – boolean
export default function NotionSelect({
  value,
  options,
  placeholder = 'Select…',
  onChange,
  onCreateNew,
  onDeleteOption,
  creating = false,
}) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const containerRef      = useRef(null)
  const inputRef          = useRef(null)

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const selectedOpt = options.find(o => o.name === value) ?? null
  const filtered    = options.filter(o =>
    o.name.toLowerCase().includes(query.toLowerCase())
  )
  const canCreate   = !!onCreateNew &&
    query.trim() !== '' &&
    !options.some(o => o.name.toLowerCase() === query.trim().toLowerCase())

  function select(name) {
    onChange(name)
    setOpen(false)
    setQuery('')
  }

  function clear(e) {
    e.stopPropagation()
    onChange(null)
  }

  async function handleCreate() {
    if (!query.trim() || creating) return
    const name = query.trim()
    setQuery('')
    setOpen(false)
    onChange(name)          // optimistic select — parent will confirm via list update
    await onCreateNew(name)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered.length === 1) select(filtered[0].name)
      else if (canCreate) handleCreate()
    }
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>

      {/* ── Trigger ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minHeight: 42,
          padding: '8px 12px',
          background: 'var(--bg-sunken)',
          borderRadius: 'var(--radius-md)',
          border: `1.5px solid ${open ? 'var(--amber)' : 'transparent'}`,
          cursor: 'pointer',
          transition: 'border-color var(--duration)',
        }}
      >
        {selectedOpt ? (
          <>
            <Chip name={selectedOpt.name} color={selectedOpt.color} />
            <button
              type="button"
              onMouseDown={clear}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                fontSize: 17,
                lineHeight: 1,
                padding: '2px 4px',
                borderRadius: 4,
                flexShrink: 0,
              }}
            >✕</button>
          </>
        ) : (
          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
            {placeholder}
          </span>
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 300,
          overflow: 'hidden',
          animation: 'ds-slide-up 140ms var(--ease)',
        }}>

          {/* Search input */}
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={onCreateNew ? 'Search or type to create…' : 'Search…'}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Options */}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '6px' }}>
            {filtered.length === 0 && !canCreate && (
              <p style={{
                padding: '10px 8px',
                margin: 0,
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
              }}>
                No options match
              </p>
            )}

            {filtered.map(opt => (
              <OptionRow
                key={opt.name}
                opt={opt}
                selected={opt.name === value}
                onSelect={() => select(opt.name)}
                onDelete={onDeleteOption ? () => onDeleteOption(opt.name) : null}
              />
            ))}

            {/* Create new */}
            {canCreate && (
              <div
                onMouseDown={e => { e.preventDefault(); handleCreate() }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 8px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: creating ? 'wait' : 'pointer',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  borderTop: filtered.length > 0 ? '1px solid var(--border)' : 'none',
                  marginTop: filtered.length > 0 ? 4 : 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{
                  width: 20, height: 20,
                  background: 'var(--amber)',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: 'var(--text-primary)',
                  flexShrink: 0,
                }}>+</span>
                <span>Create</span>
                <span style={{
                  background: 'var(--amber-light)',
                  color: '#8a5f00',
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontSize: 16,
                  fontWeight: 600,
                }}>
                  {query.trim()}
                </span>
                {creating && (
                  <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--text-tertiary)' }}>
                    saving…
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OptionRow({ opt, selected, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 6px 5px 8px',
        borderRadius: 'var(--radius-sm)',
        background: hovered || selected ? 'var(--bg-sunken)' : 'transparent',
        transition: 'background 100ms',
      }}
    >
      {/* Selectable area */}
      <div
        onMouseDown={e => { e.preventDefault(); onSelect() }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer', minWidth: 0 }}
      >
        <Chip name={opt.name} color={opt.color} />
        {selected && (
          <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: 17, flexShrink: 0 }}>✓</span>
        )}
      </div>

      {/* Delete button — only when hovered and onDelete provided */}
      {onDelete && hovered && (
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onDelete() }}
          title="Remove option"
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            border: 'none',
            borderRadius: 4,
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 16,
            lineHeight: 1,
            padding: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--coral-light)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ✕
        </button>
      )}
    </div>
  )
}
