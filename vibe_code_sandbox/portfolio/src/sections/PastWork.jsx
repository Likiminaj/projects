import { pastWork } from '../data/content'
import ProjectCard from '../components/ProjectCard'
import styles from './Section.module.css'

export default function PastWork() {
  return (
    <section id="past-work" className="section">
      <div className="container">
        <span className="section-label">Past Work</span>
        <div className={styles.sectionHeader}>
          <h2 className="display-lg">Product case studies</h2>
          <p className={styles.sectionDesc}>
            Selected work from my time at Delivery Hero, ComfortDelgro, and beyond — focused on consumer growth, loyalty, and digital inclusion.
          </p>
        </div>

        <div className={styles.grid2}>
          {pastWork.map(item => (
            <ProjectCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
