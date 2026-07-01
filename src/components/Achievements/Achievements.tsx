import { useEffect, useState } from 'react'
import {
  Star, Medal, Zap, Flame, Swords, Globe, BookOpen, Trophy,
} from 'lucide-react'
import { t } from '@/services/i18n'
import { getAchievements, saveAchievements } from '@/services/storage'
import { computeAchievements } from '@/services/achievements'
import type { Tournament, Achievement, AchievementId } from '@/types'
import styles from './Achievements.module.css'

interface AchDef {
  id: AchievementId
  icon: typeof Star
  color: string
}

const DEFS: AchDef[] = [
  { id: 'first_tournament', icon: Star,    color: '#f5c040' },
  { id: 'first_gold',       icon: Trophy,  color: '#f5c040' },
  { id: 'ten_wins',         icon: Medal,   color: '#3dba70' },
  { id: 'five_streak',      icon: Flame,   color: '#e8720a' },
  { id: 'fifty_fights',     icon: Swords,  color: '#2a8abf' },
  { id: 'abroad',           icon: Globe,   color: '#9b59b6' },
  { id: 'detailed_five',    icon: BookOpen,color: '#52606e' },
  { id: 'hundred_fights',   icon: Zap,     color: '#ff9332' },
]

interface Props {
  comps: Tournament[]
}

export default function Achievements({ comps }: Props) {
  const [list, setList] = useState<Achievement[]>([])
  const [newlyUnlocked, setNewlyUnlocked] = useState<Set<AchievementId>>(new Set())

  useEffect(() => {
    const existing = getAchievements()
    const computed = computeAchievements(comps, existing)

    const fresh = new Set<AchievementId>()
    computed.forEach((a) => {
      const prev = existing.find((e) => e.id === a.id)
      if (a.unlockedAt && !prev?.unlockedAt) fresh.add(a.id)
    })

    if (computed.some((a, i) => a.unlockedAt !== existing[i]?.unlockedAt)) {
      saveAchievements(computed)
    }
    setList(computed)
    setNewlyUnlocked(fresh)
  }, [comps])

  const unlocked = list.filter((a) => a.unlockedAt)
  if (unlocked.length === 0) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>{t('achievementsTitle')}</div>
      <div className={styles.grid}>
        {DEFS.map(({ id, icon: Icon, color }) => {
          const ach = list.find((a) => a.id === id)
          const done = !!ach?.unlockedAt
          const isNew = newlyUnlocked.has(id)
          return (
            <div
              key={id}
              className={`${styles.badge} ${done ? styles.done : styles.locked} ${isNew ? styles.newBadge : ''}`}
              title={done ? ach!.unlockedAt!.slice(0, 10) : ''}
            >
              <div className={styles.iconWrap} style={done ? { background: `${color}22`, borderColor: color } : {}}>
                <Icon size={22} strokeWidth={1.5} color={done ? color : 'var(--border)'} />
              </div>
              <span className={styles.label}>{t(`ach_${id}` as Parameters<typeof t>[0])}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
