/**
 * Design system primitives.
 * All tokens live in styles.css — these components only apply class names.
 */

export function Button({ variant = 'primary', size = 'md', fullWidth, className = '', children, ...props }) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export function Badge({ variant = 'default', children }) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}

export function Card({ children, className = '', ...props }) {
  return (
    <div className={['card', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ step, title, subtitle }) {
  return (
    <div className="card__header">
      {step && <div className="step-tag">{step}</div>}
      <h2 className="card__title">{title}</h2>
      {subtitle && <p className="card__subtitle">{subtitle}</p>}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function Input(props) {
  return <input className="input" {...props} />
}

export function EmptyState({ icon, title, body }) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state__icon">{icon}</span>}
      <p className="empty-state__title">{title}</p>
      {body && <p className="empty-state__body">{body}</p>}
    </div>
  )
}

export function Note({ variant = 'muted', children, className = '', ...props }) {
  return (
    <p className={['note', `note--${variant}`, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </p>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="loading-row">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function Divider() {
  return <hr className="divider" />
}
