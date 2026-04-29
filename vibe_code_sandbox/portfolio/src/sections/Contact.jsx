import { contact, hero } from '../data/content'
import styles from './Section.module.css'

export default function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container">
        <div className={styles.contactSection}>
          <div className={styles.contactOrb} aria-hidden="true" />
          <span className="section-label" style={{ color: 'var(--color-on-dark-soft)' }}>Contact</span>
          <h2 className={styles.contactTitle}>Let's work together.</h2>
          <a href={`mailto:${contact.email}`} className={styles.contactEmail}>
            {contact.email}
          </a>
          <a
            href={`mailto:${contact.email}`}
            className={styles.contactCTA}
          >
            Send an email
          </a>
        </div>
      </div>
    </section>
  )
}
