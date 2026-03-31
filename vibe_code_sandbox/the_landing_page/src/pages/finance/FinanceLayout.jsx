import { NavLink, Outlet } from 'react-router-dom'

const TAB_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 16px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  textDecoration: 'none',
  color: 'var(--text-secondary)',
  border: '1.5px solid transparent',
  transition: 'all var(--duration) var(--ease)',
}

const ACTIVE_STYLE = {
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  border: '1.5px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
}

export default function FinanceLayout() {
  return (
    <div>
      {/* Tab bar */}
      <div style={{
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 864, margin: '0 auto', display: 'flex', gap: 4, paddingBottom: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <NavLink
            to="/finance"
            end
            style={({ isActive }) => ({ ...TAB_STYLE, ...(isActive ? ACTIVE_STYLE : {}) })}
          >
            Overview
          </NavLink>
          <NavLink
            to="/finance/ledger"
            style={({ isActive }) => ({ ...TAB_STYLE, ...(isActive ? ACTIVE_STYLE : {}) })}
          >
            Ledger
          </NavLink>
          <NavLink
            to="/finance/recurring"
            style={({ isActive }) => ({ ...TAB_STYLE, ...(isActive ? ACTIVE_STYLE : {}) })}
          >
            Recurring
          </NavLink>
          <NavLink
            to="/finance/birthdays"
            style={({ isActive }) => ({ ...TAB_STYLE, ...(isActive ? ACTIVE_STYLE : {}) })}
          >
            Birthdays
          </NavLink>
          <NavLink
            to="/finance/cpf"
            style={({ isActive }) => ({ ...TAB_STYLE, ...(isActive ? ACTIVE_STYLE : {}) })}
          >
            CPF
          </NavLink>
          <NavLink
            to="/finance/payback"
            style={({ isActive }) => ({ ...TAB_STYLE, ...(isActive ? ACTIVE_STYLE : {}) })}
          >
            Payback
          </NavLink>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
