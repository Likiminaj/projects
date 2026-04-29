import { technicalProjects } from '../data/content'
import styles from './Section.module.css'

export default function TechnicalProjects() {
  return (
    <section id="technical-projects" className="section">
      <div className="container">
        <span className="section-label">Technical Projects</span>
        <div className={styles.sectionHeader}>
          <h2 className="display-lg">Code I've written</h2>
          <p className={styles.sectionDesc}>{technicalProjects.description}</p>
        </div>

        <div className={styles.githubBand}>
          <div className={styles.githubBandText}>
            <span className={styles.githubBandTitle}>github.com/Likiminaj/projects</span>
            <span className={styles.githubBandSub}>Explore all technical projects — web apps, data tools, and AI experiments</span>
          </div>
          <a
            href={technicalProjects.github}
            className="btn-primary"
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
