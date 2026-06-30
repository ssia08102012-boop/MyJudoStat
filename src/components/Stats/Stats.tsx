import { BarChart2, CheckCircle, XCircle, Medal, Trophy, Award, Percent, type LucideIcon } from 'lucide-react'
import { t } from '@/services/i18n'
import { calcStats } from '@/services/storage'
import type { Tournament, Lang } from '@/types'
import WinBar from './WinBar'
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
const CARDS: { key: string; Icon: LucideIcon; getVal: (s: S, wr: number) => string | number; mod?: string }[] = [
  { key: 'tournaments', Icon: BarChart2,    getVal: (s) => s.tournaments },
  { key: 'fights',      Icon: Award,        getVal: (s) => s.fights },
  { key: 'wins',        Icon: CheckCircle,  getVal: (s) => s.wins,   mod: 'win' },
  { key: 'losses',      Icon: XCircle,      getVal: (s) => s.losses, mod: 'loss' },
  { key: 'winRate',     Icon: Percent,      getVal: (_, wr) => `${wr}%` },
  { key: 'gold',        Icon: Trophy,       getVal: (s) => s.gold },
  { key: 'silver',      Icon: Medal,        getVal: (s) => s.silver },
  { key: 'bronze',      Icon: Medal,        getVal: (s) => s.bronze },
]

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

      {/* Stat cards */}
      <div className={styles.grid}>
        {CARDS.map(({ key, Icon, getVal, mod }) => (
          <div
            key={key}
            className={`${styles.card} ${mod === 'win' ? styles.cardWin : ''} ${mod === 'loss' ? styles.cardLoss : ''}`}
          >
            <Icon size={17} strokeWidth={1.5} className={styles.cardIcon} />
            <div className={styles.cardVal}>{getVal(s, winRate)}</div>
            <div className={styles.cardLbl}>{t(key as Parameters<typeof t>[0])}</div>
          </div>
        ))}
      </div>

      <WinBar wins={s.wins} losses={s.losses} winRate={winRate} />
      <Goals comps={comps} activeYear={activeYear} />
      <Charts comps={comps} activeYear={activeYear} />
    </div>
  )
}
