import { BarChart2, CheckCircle, XCircle, Medal, Trophy, Award, type LucideIcon } from 'lucide-react'
import { t } from '@/services/i18n'
import { calcStats } from '@/services/storage'
import type { Tournament, Lang } from '@/types'
import Charts from './Charts'
import Goals from './Goals'
import styles from './Stats.module.css'

interface Props {
  comps: Tournament[]
  filtered: Tournament[]
  activeYear: number | 'all'
  onFilterYear: (y: number | 'all') => void
  lang: Lang
}

type S = ReturnType<typeof calcStats>
const CARDS: { key: string; Icon: LucideIcon; getVal: (s: S) => string | number; mod?: string }[] = [
  { key: 'tournaments', Icon: BarChart2,    getVal: (s) => s.tournaments },
  { key: 'fights',      Icon: Award,        getVal: (s) => s.fights },
  { key: 'wins',        Icon: CheckCircle,  getVal: (s) => s.wins,   mod: 'win' },
  { key: 'losses',      Icon: XCircle,      getVal: (s) => s.losses, mod: 'loss' },
  { key: 'gold',        Icon: Trophy,       getVal: (s) => s.gold },
  { key: 'silver',      Icon: Medal,        getVal: (s) => s.silver },
  { key: 'bronze',      Icon: Medal,        getVal: (s) => s.bronze },
]

const RING_R = 42
const RING_CIRC = 2 * Math.PI * RING_R

function WinRing({ winRate }: { winRate: number }) {
  const dash = (winRate / 100) * RING_CIRC
  const color = winRate >= 70 ? 'var(--green)' : winRate >= 50 ? 'var(--orange)' : 'var(--red)'
  return (
    <div className={styles.winRingCard}>
      <svg className={styles.winRingSvg} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={RING_R} className={styles.ringTrack} />
        <circle
          cx="50" cy="50" r={RING_R}
          className={styles.ringFill}
          stroke={color}
          strokeDasharray={`${dash} ${RING_CIRC}`}
          strokeDashoffset={RING_CIRC * 0.25}
        />
      </svg>
      <div className={styles.winRingInner}>
        <div className={styles.winRingVal} style={{ color }}>{winRate}%</div>
        <div className={styles.winRingLbl}>{t('winRate')}</div>
      </div>
    </div>
  )
}

export default function Stats({ comps, filtered, activeYear, onFilterYear, lang: _lang }: Props) {
  const s = calcStats(filtered)
  const winRate = s.fights > 0 ? Math.round((s.wins / s.fights) * 100) : 0
  const years = [...new Set(comps.map((c) => c.year))].sort()

  return (
    <div className={styles.wrap}>
      {/* Year filters */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${activeYear === 'all' ? styles.active : ''}`}
          onClick={() => onFilterYear('all')}
        >
          {t('filterAll')}
        </button>
        {years.map((y) => (
          <button
            key={y}
            className={`${styles.filterBtn} ${activeYear === y ? styles.active : ''}`}
            onClick={() => onFilterYear(y)}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Stats row: ring + cards */}
      <div className={styles.statsRow}>
        <WinRing winRate={winRate} />
        <div className={styles.grid}>
          {CARDS.map(({ key, Icon, getVal, mod }) => (
            <div
              key={key}
              className={`${styles.card} ${mod === 'win' ? styles.cardWin : ''} ${mod === 'loss' ? styles.cardLoss : ''}`}
            >
              <Icon size={16} strokeWidth={1.5} className={styles.cardIcon} />
              <div className={styles.cardVal}>{getVal(s)}</div>
              <div className={styles.cardLbl}>{t(key as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </div>

      <Goals comps={comps} activeYear={activeYear} />
      <Charts comps={comps} activeYear={activeYear} />
    </div>
  )
}
