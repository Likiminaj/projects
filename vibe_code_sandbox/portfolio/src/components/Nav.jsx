import { useState, useEffect } from 'react'
import styles from './Nav.module.css'

const navLinks = [
  { label: 'Work', href: '#past-work' },
  { label: 'Vibe Code', href: '#vibe-code' },
  { label: 'Case Studies', href: '#case-studies' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLink = () => setOpen(false)

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <a href="#hero" className={styles.wordmark}>Likitha R.</a>

        <nav className={styles.links} aria-label="Main navigation">
          {navLinks.map(({ label, href }) => (
            <a key={href} href={href} className={styles.link}>{label}</a>
          ))}
        </nav>

        <button
          className={styles.hamburger}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className={`${styles.bar} ${open ? styles.barOpen1 : ''}`} />
          <span className={`${styles.bar} ${open ? styles.barOpen2 : ''}`} />
          <span className={`${styles.bar} ${open ? styles.barOpen3 : ''}`} />
        </button>
      </div>

      {open && (
        <div className={styles.mobileMenu}>
          {navLinks.map(({ label, href }) => (
            <a key={href} href={href} className={styles.mobileLink} onClick={handleLink}>
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
