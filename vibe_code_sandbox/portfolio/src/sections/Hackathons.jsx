import { hackathons } from '../data/content'
import ProjectCard from '../components/ProjectCard'
import styles from './Section.module.css'

export default function Hackathons() {
  return (
    <section id="hackathons" className="section" style={{ backgroundColor: 'var(--color-canvas-soft)' }}>
      <div className="container">
        <span className="section-label">Hackathons</span>
        <div className={styles.sectionHeader}>
          <h2 className="display-lg">Building under pressure</h2>
          <p className={styles.sectionDesc}>
            Ideas I've pitched and built at hackathons.
          </p>
        </div>

        <div className={styles.grid1}>
          {hackathons.map(item => (
            <ProjectCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
