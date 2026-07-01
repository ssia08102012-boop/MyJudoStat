import { ExternalLink } from 'lucide-react'
import styles from './ExternalLinks.module.css'

interface LinkItem {
  name: string
  sub: string
  url: string
  color: string
  abbr: string
}

const LINKS: LinkItem[] = [
  {
    name: 'IJF Judo',
    sub: 'International Judo Federation',
    url: 'https://www.ijf.org',
    color: '#1a3a7a',
    abbr: 'IJF',
  },
  {
    name: 'JudoTV',
    sub: 'Офіційне стримінгове ТБ дзюдо',
    url: 'https://www.judotv.com',
    color: '#c8922a',
    abbr: 'TV',
  },
  {
    name: 'Judo Mobile',
    sub: 'Polski Związek Judo',
    url: 'https://pzjudo.pl',
    color: '#cc0000',
    abbr: 'PZJ',
  },
  {
    name: 'SportsManago',
    sub: 'Klub Judo Ryś · konto',
    url: 'https://sportsmanago.pl',
    color: '#1a7abf',
    abbr: 'SM',
  },
  {
    name: 'JudoManager',
    sub: 'Wyniki zawodów · Polska',
    url: 'https://judomanager.eu',
    color: '#222222',
    abbr: 'JM',
  },
  {
    name: 'Klub Judo Ryś',
    sub: 'Ranking & Kalendarz',
    url: 'https://judo-rys.pl/rank/sum.php',
    color: '#e8720a',
    abbr: 'RYŚ',
  },
]

export default function ExternalLinks() {
  return (
    <div className={styles.wrap}>
      {LINKS.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className={styles.card}
          style={{ '--accent': link.color } as React.CSSProperties}
        >
          <div className={styles.abbr} style={{ background: link.color }}>
            {link.abbr}
          </div>
          <div className={styles.info}>
            <div className={styles.name}>{link.name}</div>
            <div className={styles.sub}>{link.sub}</div>
          </div>
          <ExternalLink size={13} className={styles.icon} />
        </a>
      ))}
    </div>
  )
}
