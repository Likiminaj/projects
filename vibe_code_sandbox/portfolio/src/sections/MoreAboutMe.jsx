import { moreAboutMe } from '../data/content'
import styles from './Section.module.css'

export default function MoreAboutMe() {
  return (
    <section id="about" className="section" style={{ backgroundColor: 'var(--color-canvas-soft)' }}>
      <div className="container">
        <div className={styles.aboutCallout}>
          <div className={styles.aboutCalloutOrb} aria-hidden="true" />
          <div className={styles.aboutCalloutText}>
            <h2 className={styles.aboutCalloutTitle}>More about me</h2>
            <p className={styles.aboutCalloutDesc}>
              Beyond product and code — my interests, what drives me, and what I think about.
            </p>
          </div>
          <a
            href={moreAboutMe.url}
            className="btn-outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read here →
          </a>
        </div>
      </div>
    </section>
  )
}
