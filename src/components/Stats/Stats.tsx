import { BarChart2, CheckCircle, XCircle, Medal, Trophy, Award } from 'lucide-react'
import { t } from '@/services/i18n'
import { calcStats } from '@/services/storage'
import type { Tournament, Lang } from '@/types'
import WinBar from './WinBar'
import Charts from './Charts'
import styles from './Stats.module.css'

interface Props {
  comps: Tournament[]
  filtered: Tournament[]
  activeYear: number | 'all'
  onFilterYear: (y: number | 'all') => void
  lang: Lang
}

const STAT_CARDS = [
  { key: 'tournaments' as const, Icon: BarChart2 },
  { key: 'fights'      as const, Icon: Award },
  { key: 'wins'        as const, Icon: CheckCircle },
  { key: 'losses'      as const, Icon: XCircle },
  { key: 'gold'        as const, Icon: Trophy },
  { key: 'silver'      as const, Icon: Medal },
  { key: 'bronze'      as const, Icon: Medal },
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
        {STAT_CARDS.map(({ key, Icon }) => (
          <div key={key} className={`${styles.card} ${key === 'wins' ? styles.cardWin : ''} ${key === 'losses' ? styles.cardLoss : ''}`}>
            <Icon size={18} strokeWidth={1.5} className={styles.cardIcon} />
            <div className={styles.cardVal}>
              {key === 'fights' ? s.fights
               : key === 'wins' ? s.wins
               : key === 'losses' ? s.losses
               : key === 'gold' ? s.gold
               : key === 'silver' ? s.silver
               : key === 'bronze' ? s.bronze
               : s.tournaments}
            </div>
            <div className={styles.cardLbl}>{t(key === 'bronze' ? 'bronze' : key)}</div>
          </div>
        ))}
        {/* Win rate card */}
        <div className={styles.card}>
          <BarChart2 size={18} strokeWidth={1.5} className={styles.cardIcon} />
          <div className={styles.cardVal}>{winRate}%</div>
          <div className={styles.cardLbl}>{t('winRate')}</div>
        </div>
      </div>

      {/* Win bar */}
      <WinBar wins={s.wins} losses={s.losses} winRate={winRate} />

      {/* Charts */}
      <Charts comps={comps} activeYear={activeYear} />
    </div>
  )
}
