import { Link, useLocation } from 'react-router-dom'

const TABS = [
  {
    label: 'Home',
    to: '/',
    match: path => path === '/',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 4l9 8"/>
        <path d="M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10"/>
      </svg>
    ),
  },
  {
    label: 'Finance',
    to: '/finance',
    match: path => path.startsWith('/finance'),
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22"/>
        <path d="M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
  {
    label: 'Tasks',
    to: '/tasks',
    match: path => path.startsWith('/tasks'),
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <path d="M9 12l2 2 4-4"/>
        <path d="M9 8h6M9 16h4"/>
      </svg>
    ),
  },
  {
    label: 'Habits',
    to: '/habits',
    match: path => path.startsWith('/habits'),
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
      </svg>
    ),
  },
  {
    label: 'Review',
    to: null,
    match: () => false,
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M9 16l2 2 4-4"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      position:       'fixed',
      bottom:         12,
      left:           '50%',
      transform:      'translateX(-50%)',
      width:          'min(calc(100% - 24px), 1296px)',
      height:         60,
      background:     'var(--amber)',
      borderRadius:   999,
      boxShadow:      '0 4px 20px rgba(28, 25, 23, 0.22), 0 1px 4px rgba(28, 25, 23, 0.12)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-around',
      paddingInline:  8,
      zIndex:         100,
    }}>
      {TABS.map(tab => {
        const isActive   = tab.match(pathname)
        const isDisabled = tab.to === null

        const tabContent = (
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           3,
            opacity:       isDisabled ? 0.35 : 1,
          }}>
            <div style={{
              width:          40,
              height:         32,
              borderRadius:   99,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              background:     isActive ? 'rgba(28,25,23,0.13)' : 'transparent',
              color:          isActive ? 'var(--text-primary)' : 'rgba(28,25,23,0.45)',
              transition:     'background 180ms ease, color 180ms ease',
            }}>
              {tab.icon}
            </div>
            <span style={{
              fontSize:   9,
              fontWeight: isActive ? 700 : 500,
              color:      isActive ? 'var(--text-primary)' : 'rgba(28,25,23,0.45)',
              lineHeight: 1,
              transition: 'color 180ms ease',
            }}>
              {tab.label}
            </span>
          </div>
        )

        if (isDisabled) {
          return (
            <div key={tab.label} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              {tabContent}
            </div>
          )
        }

        return (
          <Link key={tab.label} to={tab.to}
            style={{ flex: 1, display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
            {tabContent}
          </Link>
        )
      })}
    </nav>
  )
}
