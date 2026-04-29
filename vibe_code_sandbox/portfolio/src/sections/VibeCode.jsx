import { vibeCode } from '../data/content'
import ProjectCard from '../components/ProjectCard'
import styles from './Section.module.css'

export default function VibeCode() {
  return (
    <section id="vibe-code" className="section" style={{ backgroundColor: 'var(--color-canvas-soft)' }}>
      <div className="container">
        <span className="section-label">Vibe Code</span>
        <div className={styles.sectionHeader}>
          <h2 className="display-lg">Things I built for fun</h2>
          <p className={styles.sectionDesc}>{vibeCode.description}</p>
        </div>

        <div className={styles.grid3}>
          {vibeCode.projects.map(item => (
            <ProjectCard key={item.title} {...item} />
          ))}
        </div>

        <div className={styles.githubBand}>
          <div className={styles.githubBandText}>
            <span className={styles.githubBandTitle}>All projects on GitHub</span>
            <span className={styles.githubBandSub}>Source code available for download and exploration</span>
          </div>
          <a
            href={vibeCode.github}
            className="btn-outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </section>
  )
}
