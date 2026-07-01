import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import logoRys from '@/assets/logo-rys.png'
import styles from './ExternalLinks.module.css'

interface LinkItem {
  name: string
  sub: string
  url: string
  color: string
  abbr: string
  domain: string
  logo?: string
}

const LINKS: LinkItem[] = [
  {
    name: 'IJF Judo',
    sub: 'International Judo Federation',
    url: 'https://www.ijf.org',
    color: '#1a3a7a',
    abbr: 'IJF',
    domain: 'ijf.org',
  },
  {
    name: 'JudoTV',
    sub: 'Офіційне стримінгове ТБ дзюдо',
    url: 'https://www.judotv.com',
    color: '#c8922a',
    abbr: 'TV',
    domain: 'judotv.com',
  },
  {
    name: 'Judo Mobile',
    sub: 'Polski Związek Judo',
    url: 'https://pzjudo.pl',
    color: '#cc0000',
    abbr: 'PZJ',
    domain: 'pzjudo.pl',
  },
  {
    name: 'SportsManago',
    sub: 'Klub Judo Ryś · konto',
    url: 'https://sportsmanago.pl',
    color: '#1a7abf',
    abbr: 'SM',
    domain: 'sportsmanago.pl',
  },
  {
    name: 'JudoManager',
    sub: 'Wyniki zawodów · Polska',
    url: 'https://judomanager.eu',
    color: '#222222',
    abbr: 'JM',
    domain: 'judomanager.eu',
  },
  {
    name: 'Klub Judo Ryś',
    sub: 'Ranking & Kalendarz',
    url: 'https://judo-rys.pl/rank/sum.php',
    color: '#e8720a',
    abbr: 'RYŚ',
    domain: 'judo-rys.pl',
    logo: logoRys,
  },
]

function LogoBadge({ link }: { link: LinkItem }) {
  const [failed, setFailed] = useState(false)
  const isLocal = Boolean(link.logo)
  const src = link.logo ?? `https://www.google.com/s2/favicons?sz=128&domain=${link.domain}`

  if (failed) {
    return (
      <div className={styles.abbr} style={{ background: link.color }}>
        {link.abbr}
      </div>
    )
  }

  return (
    <div
      className={styles.logoBadge}
      style={isLocal ? { background: link.color } : undefined}
    >
      <img
        src={src}
        alt=""
        className={isLocal ? styles.localImg : styles.faviconImg}
        onError={() => setFailed(true)}
      />
    </div>
  )
}

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
          <LogoBadge link={link} />
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
