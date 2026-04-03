import { useState, useEffect } from 'react'

// ── Constants ─────────────────────────────────────────────────────
const AREAS      = ['Career', 'Ventures', 'Learning', 'Personal', 'Pending Matcha', '42 School', 'Health']
const PRIORITIES = ['Low', 'Medium', 'High']

const AREA_STYLE = {
  'Career':         { bg: 'var(--amber-light)',    color: '#8a5f00' },
  'Ventures':       { bg: 'var(--green-light)',    color: '#1e5c1b' },
  'Learning':       { bg: 'var(--sky-light)',      color: '#1a5a8a' },
  'Personal':       { bg: 'var(--lavender-light)', color: '#5a3e8a' },
  'Pending Matcha': { bg: 'var(--coral-light)',    color: '#9a2a1a' },
  '42 School':      { bg: 'var(--bg-sunken)',      color: 'var(--text-secondary)' },
  'Health':         { bg: 'var(--green-light)',    color: '#1e5c1b' },
}

const todayStr = () => new Date().toISOString().slice(0, 10)

function formatDate(d) {
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })
}

const EMPTY_ADD = { name: '', area: '', priority: 'Medium', dueDate: '', notes: '' }

// ── AreaBadge ─────────────────────────────────────────────────────
function AreaBadge({ area }) {
  if (!area) return null
  const style = AREA_STYLE[area] ?? { bg: 'var(--bg-sunken)', color: 'var(--text-secondary)' }
  return (
    <span style={{
      backgroundColor: style.bg,
      color:           style.color,
      fontSize:        9,
      fontWeight:      700,
      padding:         '2px 8px',
      borderRadius:    'var(--radius-pill)',
      whiteSpace:      'nowrap',
      flexShrink:      0,
    }}>
      {area}
    </span>
  )
}

// ── TaskRow ───────────────────────────────────────────────────────
function TaskRow({ task, onCheck, onUpdate, onUndo }) {
  const [expanded, setExpanded] = useState(false)
  const [form,     setForm]     = useState({
    name:           task.name,
    priority:       task.priority ?? 'Medium',
    area:           task.area ?? '',
    dueDate:        task.dueDate ?? '',
    notes:          task.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const isDone   = ['Done', 'Dropped'].includes(task.status)
  const isOverdue = !isDone && task.dueDate && task.dueDate < todayStr()

  function handleSave() {
    setSaving(true)
    onUpdate(task.id, form).finally(() => {
      setSaving(false)
      setExpanded(false)
    })
  }

  return (
    <div>
      {/* Main row */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        padding:       '11px 0',
        borderBottom:  '1px solid var(--border)',
      }}>
        {/* Checkbox / done circle */}
        {isDone ? (
          <span style={{
            width:           22,
            height:          22,
            borderRadius:    6,
            backgroundColor: 'var(--green)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            flexShrink:      0,
          }}>
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="white" fill="none"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        ) : (
          <button
            onClick={() => onCheck(task.id)}
            style={{
              width:        22,
              height:       22,
              borderRadius: 6,
              border:       '2px solid var(--border)',
              background:   'transparent',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              flexShrink:   0,
              padding:      0,
            }}
            aria-label="Mark done"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="var(--text-tertiary)"
              fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: 0.3 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        )}

        {/* Task name */}
        <span
          onClick={() => { if (!isDone) setExpanded(e => !e) }}
          style={{
            flex:           1,
            fontSize:       'var(--text-sm)',
            cursor:         isDone ? 'default' : 'pointer',
            textDecoration: isDone ? 'line-through' : 'none',
            color:          isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
            userSelect:     'none',
            minWidth:       0,
            overflow:       'hidden',
            textOverflow:   'ellipsis',
            whiteSpace:     'nowrap',
          }}
        >
          {task.name}
        </span>

        {/* Area badge */}
        {task.area && <AreaBadge area={task.area} />}

        {/* Due date */}
        {task.dueDate && (
          <span style={{
            fontSize:   9,
            color:      isOverdue ? 'var(--coral)' : 'var(--text-tertiary)',
            fontWeight: isOverdue ? 700 : 400,
            flexShrink: 0,
          }}>
            {formatDate(task.dueDate)}
          </span>
        )}

        {/* Undo button */}
        {isDone && (
          <button
            className="ds-btn ds-btn--ghost ds-btn--sm"
            onClick={() => onUndo(task.id)}
            style={{ flexShrink: 0 }}
          >
            Undo
          </button>
        )}
      </div>

      {/* Edit form */}
      {expanded && !isDone && (
        <div style={{
          paddingLeft:   32,
          paddingBottom: 14,
          display:       'flex',
          flexDirection: 'column',
          gap:           10,
          paddingTop:    8,
        }}>
          {/* Name */}
          <input
            className="ds-input"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Task name"
          />

          {/* Priority toggle */}
          <div>
            <div className="ds-label" style={{ marginBottom: 4 }}>Priority</div>
            <div className="ds-toggle">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  className={`ds-toggle-btn${form.priority === p ? ' ds-toggle-btn--active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                  type="button"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Area + due date row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="ds-input"
              value={form.area}
              onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
              style={{ flex: 1 }}
            >
              <option value="">No area</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <input
              className="ds-input"
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              style={{ flex: 1 }}
            />
          </div>

          {/* Notes */}
          <input
            className="ds-input"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes"
          />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              className="ds-btn ds-btn--ghost ds-btn--sm"
              onClick={() => setExpanded(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="ds-btn ds-btn--primary ds-btn--sm"
              onClick={handleSave}
              disabled={saving}
              type="button"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── TaskGroup ─────────────────────────────────────────────────────
function TaskGroup({ title, tasks, onCheck, onUpdate, onUndo }) {
  if (tasks.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize:      9,
        fontWeight:    800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         'var(--text-tertiary)',
        marginBottom:  4,
      }}>
        {title}
      </div>
      <div className="ds-card" style={{ overflow: 'hidden', padding: '0 14px' }}>
        {tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onCheck={onCheck}
            onUpdate={onUpdate}
            onUndo={onUndo}
          />
        ))}
      </div>
    </div>
  )
}

// ── Tasks page ────────────────────────────────────────────────────
export default function Tasks() {
  const [tasks,         setTasks]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState('All')
  const [showAddForm,   setShowAddForm]   = useState(false)
  const [addForm,       setAddForm]       = useState(EMPTY_ADD)
  const [adding,        setAdding]        = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [error,         setError]         = useState(null)

  async function load() {
    try {
      const res = await fetch('/api/tasks')
      const json = await res.json()
      if (json.success) setTasks(json.data)
      else setError(json.error ?? 'Failed to load tasks')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCheck(id) {
    // Optimistic update
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: 'Done' } : t))
    try {
      const res  = await fetch(`/api/tasks/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'Done' }),
      })
      const json = await res.json()
      if (json.success) {
        setTasks(ts => ts.map(t => t.id === id ? json.data : t))
        if (json.data.recurring) load()
      }
    } catch (e) {
      setError(e.message)
      load() // revert optimistic update
    }
  }

  async function handleUpdate(id, fields) {
    const res  = await fetch(`/api/tasks/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(fields),
    })
    const json = await res.json()
    if (json.success) {
      setTasks(ts => ts.map(t => t.id === id ? json.data : t))
    } else {
      setError(json.error ?? 'Update failed')
    }
  }

  async function handleUndo(id) {
    const res  = await fetch(`/api/tasks/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'Todo' }),
    })
    const json = await res.json()
    if (json.success) {
      setTasks(ts => ts.map(t => t.id === id ? json.data : t))
    }
  }

  async function handleAdd() {
    if (!addForm.name.trim()) return
    setAdding(true)
    try {
      const res  = await fetch('/api/tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(addForm),
      })
      const json = await res.json()
      if (json.success) {
        setTasks(ts => [json.data, ...ts])
        setAddForm(EMPTY_ADD)
        setShowAddForm(false)
      } else {
        setError(json.error ?? 'Failed to add task')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setAdding(false)
    }
  }

  // ── Derived state ───────────────────────────────────────────────
  const today     = todayStr()
  const active    = tasks.filter(t => !['Done', 'Dropped'].includes(t.status))
  const filtered  = filter === 'All' ? active : active.filter(t => t.area === filter)
  const overdue   = filtered.filter(t => t.dueDate && t.dueDate < today)
  const todayTasks = filtered.filter(t => t.dueDate === today)
  const upcoming  = filtered.filter(t => t.dueDate && t.dueDate > today)
  const noDate    = filtered.filter(t => !t.dueDate)
  const completed = tasks
    .filter(t => ['Done', 'Dropped'].includes(t.status))
    .filter(t => filter === 'All' || t.area === filter)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  const allEmpty = overdue.length === 0 && todayTasks.length === 0
    && upcoming.length === 0 && noDate.length === 0

  if (loading) {
    return (
      <div className="ds-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading…</span>
      </div>
    )
  }

  return (
    <div className="ds-page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="ds-heading">Tasks</h1>
        <button
          className="ds-btn ds-btn--primary ds-btn--sm"
          onClick={() => setShowAddForm(f => !f)}
          type="button"
        >
          {showAddForm ? '✕ Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="ds-card ds-card--padded" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Name */}
            <input
              className="ds-input"
              placeholder="Task name"
              value={addForm.name}
              autoFocus
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            />

            {/* Priority toggle */}
            <div>
              <div className="ds-label" style={{ marginBottom: 4 }}>Priority</div>
              <div className="ds-toggle">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    className={`ds-toggle-btn${addForm.priority === p ? ' ds-toggle-btn--active' : ''}`}
                    onClick={() => setAddForm(f => ({ ...f, priority: p }))}
                    type="button"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Area + date row */}
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="ds-input"
                value={addForm.area}
                onChange={e => setAddForm(f => ({ ...f, area: e.target.value }))}
                style={{ flex: 1 }}
              >
                <option value="">No area</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <input
                className="ds-input"
                type="date"
                value={addForm.dueDate}
                onChange={e => setAddForm(f => ({ ...f, dueDate: e.target.value }))}
                style={{ flex: 1 }}
              />
            </div>

            {/* Notes */}
            <input
              className="ds-input"
              placeholder="Notes (optional)"
              value={addForm.notes}
              onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                className="ds-btn ds-btn--ghost ds-btn--sm"
                onClick={() => { setShowAddForm(false); setAddForm(EMPTY_ADD) }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="ds-btn ds-btn--primary ds-btn--sm"
                onClick={handleAdd}
                disabled={adding || !addForm.name.trim()}
                type="button"
              >
                {adding ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area filter chips */}
      <div style={{
        display:          'flex',
        gap:              6,
        overflowX:        'auto',
        scrollbarWidth:   'none',
        marginBottom:     20,
        paddingBottom:    2,
      }}>
        {['All', ...AREAS].map(a => (
          <button
            key={a}
            className={`ds-chip${filter === a ? ' ds-chip--active' : ''}`}
            onClick={() => setFilter(a)}
            type="button"
            style={{ flexShrink: 0 }}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          color:         'var(--coral)',
          fontSize:      'var(--text-sm)',
          marginBottom:  16,
          padding:       '8px 12px',
          background:    'var(--coral-light)',
          borderRadius:  'var(--radius-md)',
        }}>
          {error}
        </div>
      )}

      {/* Task groups */}
      <TaskGroup title="Overdue"   tasks={overdue}    onCheck={handleCheck} onUpdate={handleUpdate} onUndo={handleUndo} />
      <TaskGroup title="Today"     tasks={todayTasks} onCheck={handleCheck} onUpdate={handleUpdate} onUndo={handleUndo} />
      <TaskGroup title="Upcoming"  tasks={upcoming}   onCheck={handleCheck} onUpdate={handleUpdate} onUndo={handleUndo} />
      <TaskGroup title="No date"   tasks={noDate}     onCheck={handleCheck} onUpdate={handleUpdate} onUndo={handleUndo} />

      {/* Empty state */}
      {allEmpty && (
        <div style={{
          textAlign:  'center',
          padding:    '48px 0',
          color:      'var(--text-tertiary)',
          fontSize:   'var(--text-sm)',
        }}>
          {filter === 'All' ? 'No active tasks' : `No active tasks in ${filter}`}
        </div>
      )}

      {/* Completed section */}
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          style={{
            background:    'none',
            border:        'none',
            cursor:        'pointer',
            fontSize:      'var(--text-sm)',
            color:         'var(--text-tertiary)',
            fontWeight:    600,
            padding:       '4px 0',
            marginBottom:  showCompleted ? 12 : 0,
          }}
          onClick={() => setShowCompleted(s => !s)}
        >
          Completed ({completed.length}) {showCompleted ? '▲' : '▼'}
        </button>

        {showCompleted && completed.length > 0 && (
          <div className="ds-card" style={{ overflow: 'hidden', padding: '0 14px' }}>
            {completed.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onCheck={handleCheck}
                onUpdate={handleUpdate}
                onUndo={handleUndo}
              />
            ))}
          </div>
        )}

        {showCompleted && completed.length === 0 && (
          <div style={{
            textAlign:  'center',
            padding:    '24px 0',
            color:      'var(--text-tertiary)',
            fontSize:   'var(--text-sm)',
          }}>
            No completed tasks
          </div>
        )}
      </div>
    </div>
  )
}
