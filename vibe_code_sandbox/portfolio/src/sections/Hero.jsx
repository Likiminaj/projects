import { hero } from '../data/content'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />
      <div className={styles.orb3} aria-hidden="true" />

      <div className="container">
        <div className={styles.inner}>
          <div className={styles.eyebrow}>
            <span className={styles.available}>
              <span className={styles.dot} />
              Open to opportunities
            </span>
          </div>

          <h1 className={`display-mega ${styles.name}`}>
            Hello, I'm<br />Likitha.
          </h1>

          <p className={styles.tagline}>{hero.tagline}</p>

          <p className={styles.bio}>{hero.bio}</p>

          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>📍</span>
              {hero.location}
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>📌</span>
              Previously at {hero.previously}
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>🎓</span>
              {hero.education}
            </span>
          </div>

          <div className={styles.ctas}>
            <a
              href={hero.resumeUrl}
              className="btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Resume
            </a>
            <a href="#contact" className="btn-outline">
              Get in touch
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
