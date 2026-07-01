import { Search } from 'lucide-react'
import { useState } from 'react'
import { t } from '@/services/i18n'
import type { Tournament, Lang } from '@/types'
import TournamentCard from './TournamentCard'
import styles from './Tournaments.module.css'

interface Props {
  comps: Tournament[]
  allComps: Tournament[]
  onEdit: (c: Tournament) => void
  onDelete: (id: string) => Promise<void>
  onAdd: (c: Tournament) => Promise<void>
  onOpenFight: (comp: Tournament, fi: number) => void
  showToast: (msg: string) => void
  lang: Lang
}

type MedalFilter = 'all' | 'gold' | 'medal'

export default function Tournaments({ comps, onEdit, onDelete, onOpenFight, showToast }: Props) {
  const [query, setQuery] = useState('')
  const [medalFilter, setMedalFilter] = useState<MedalFilter>('all')

  const visible = comps.filter((c) => {
    if (query) {
      const q = query.toLowerCase()
      if (!c.name.toLowerCase().includes(q) && !(c.location ?? '').toLowerCase().includes(q)) return false
    }
    if (medalFilter === 'gold'  && c.place !== 1) return false
    if (medalFilter === 'medal' && (c.place == null || c.place > 3)) return false
    return true
  })

  return (
    <div className={styles.wrap}>
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.medalFilters}>
          {(['all', 'gold', 'medal'] as MedalFilter[]).map((f) => (
            <button
              key={f}
              className={`${styles.mfBtn} ${medalFilter === f ? styles.active : ''}`}
              onClick={() => setMedalFilter(f)}
            >
              {f === 'all' ? t('filterAll') : f === 'gold' ? t('filterGold') : t('filterMedal')}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>{t('noTournaments')}</div>
      ) : (
        <div className={styles.list}>
          {visible.map((comp) => (
            <TournamentCard
              key={comp.id}
              comp={comp}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenFight={onOpenFight}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  )
}
