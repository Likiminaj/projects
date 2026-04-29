import styles from './ProjectCard.module.css'

export default function ProjectCard({ title, subtitle, company, description, url, wip, comingSoon, tech }) {
  const Tag = url ? 'a' : 'div'
  const linkProps = url
    ? { href: url, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <Tag className={`${styles.card} ${wip ? styles.cardWip : ''}`} {...linkProps}>
      <div className={styles.top}>
        <div className={styles.meta}>
          {company && <span className={styles.company}>{company}</span>}
          <div className={styles.badges}>
            {wip && <span className="badge badge-wip">WIP</span>}
            {comingSoon && <span className="badge badge-wip">Coming Soon</span>}
          </div>
        </div>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {description && (
        <p className={styles.description}>{description}</p>
      )}

      {tech && tech.length > 0 && (
        <div className={styles.techList}>
          {tech.map(t => (
            <span key={t} className={styles.techTag}>{t}</span>
          ))}
        </div>
      )}

      {url && !wip && (
        <div className={styles.arrow} aria-hidden="true">→</div>
      )}
    </Tag>
  )
}
