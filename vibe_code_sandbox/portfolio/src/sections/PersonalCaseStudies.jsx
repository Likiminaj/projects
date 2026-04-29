import { personalCaseStudies } from '../data/content'
import ProjectCard from '../components/ProjectCard'
import styles from './Section.module.css'

export default function PersonalCaseStudies() {
  return (
    <section id="case-studies" className="section">
      <div className="container">
        <span className="section-label">Personal Case Studies</span>
        <div className={styles.sectionHeader}>
          <h2 className="display-lg">Independent explorations</h2>
          <p className={styles.sectionDesc}>
            Product teardowns and design explorations I did out of curiosity.
          </p>
        </div>

        <div className={styles.grid2}>
          {personalCaseStudies.map(item => (
            <ProjectCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
