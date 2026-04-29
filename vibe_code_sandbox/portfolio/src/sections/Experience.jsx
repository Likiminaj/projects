import { experience } from '../data/content'
import styles from './Section.module.css'

export default function Experience() {
  return (
    <section id="experience" className="section" style={{ backgroundColor: 'var(--color-canvas-soft)' }}>
      <div className="container">
        <span className="section-label">Experience</span>
        <div className={styles.sectionHeader}>
          <h2 className="display-lg">Where I've worked</h2>
        </div>

        <div className={styles.timeline}>
          {experience.map(item => (
            <div key={`${item.company}-${item.period}`} className={styles.timelineItem}>
              <span className={styles.timelinePeriod}>{item.period}</span>
              <div className={styles.timelineContent}>
                <span className={styles.timelineCompany}>
                  {item.current && <span className={styles.currentDot} />}
                  {item.company}
                </span>
                <span className={styles.timelineRole}>{item.role}</span>
                {item.note && <span className={styles.timelineNote}>{item.note}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
