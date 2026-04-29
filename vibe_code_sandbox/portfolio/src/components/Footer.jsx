import { hero, contact } from '../data/content'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.name}>Likitha Raghavendra</span>
        <nav className={styles.links} aria-label="Footer navigation">
          <a href="#past-work" className={styles.link}>Work</a>
          <a href="#vibe-code" className={styles.link}>Vibe Code</a>
          <a href="#experience" className={styles.link}>Experience</a>
          <a href={hero.resumeUrl} className={styles.link} target="_blank" rel="noopener noreferrer">Resume</a>
          <a href={`mailto:${contact.email}`} className={styles.link}>Email</a>
          <a href={hero.github} className={styles.link} target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
        <span className={styles.copy}>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}
