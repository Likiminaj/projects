import { education } from '../data/content'
import styles from './Section.module.css'

export default function Education() {
  return (
    <section id="education" className="section">
      <div className="container">
        <span className="section-label">Education</span>
        <div className={styles.sectionHeader}>
          <h2 className="display-lg">Background</h2>
        </div>

        <div className={styles.educationList}>
          {education.map(item => (
            <div key={item.institution} className={styles.educationItem}>
              <span className={styles.educationInstitution}>{item.institution}</span>
              <span className={styles.educationDegree}>{item.degree}</span>
              {item.note && <span className={styles.educationNote}>{item.note}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
