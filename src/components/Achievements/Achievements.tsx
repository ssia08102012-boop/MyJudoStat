import { useEffect, useMemo, useState } from 'react'
import {
  Award, Star, Medal, Zap, Flame, Swords, Globe, BookOpen, Trophy,
} from 'lucide-react'
import { t } from '@/services/i18n'
import { getAchievements, getTrainingEntries, saveAchievements } from '@/services/storage'
import { computeAchievements, getWinStreaks } from '@/services/achievements'
import type { Tournament, Achievement, AchievementId } from '@/types'
import styles from './Achievements.module.css'

interface AchDef {
  id: AchievementId
  icon: typeof Star
  color: string
  hint: string
}

const DEFS: AchDef[] = [
  { id: 'first_tournament', icon: Star,    color: '#f5c040', hint: 'Зареєструй 1 турнір' },
  { id: 'first_gold',       icon: Trophy,  color: '#f5c040', hint: 'Виграй турнір (1 місце)' },
  { id: 'ten_wins',         icon: Medal,   color: '#3dba70', hint: '10 перемог у боях' },
  { id: 'five_streak',      icon: Flame,   color: '#e8720a', hint: '5 перемог поспіль' },
  { id: 'fifty_fights',     icon: Swords,  color: '#2a8abf', hint: '50 боїв' },
  { id: 'abroad',           icon: Globe,   color: '#9b59b6', hint: 'Турнір не в Польщі' },
  { id: 'detailed_five',    icon: BookOpen,color: '#2abfa0', hint: '5 боїв з деталями' },
  { id: 'hundred_fights',   icon: Zap,     color: '#ff9332', hint: '100 боїв' },
]

interface Props {
  comps: Tournament[]
}

export default function Achievements({ comps }: Props) {
  const [list, setList] = useState<Achievement[]>([])
  const [newlyUnlocked, setNewlyUnlocked] = useState<Set<AchievementId>>(new Set())
  const [recordsOpen, setRecordsOpen] = useState(false)
  const live = useMemo(() => {
    const streak = getWinStreaks(comps)
    const records = new Map<string, { name: string, bestSet: number, bestWorkout: number }>()

    getTrainingEntries().forEach((entry) => {
      const totalsInWorkout = new Map<string, number>()
      ;(entry.metrics ?? []).forEach((metric) => {
        const name = metric.name.trim()
        if (!name) return
        const key = name.toLocaleLowerCase()
        const stored = records.get(key) ?? { name, bestSet: 0, bestWorkout: 0 }
        const bestSet = metric.bestSet ?? Math.max(...(metric.sets ?? [metric.value]), 0)
        stored.bestSet = Math.max(stored.bestSet, bestSet)
        records.set(key, stored)
        totalsInWorkout.set(key, (totalsInWorkout.get(key) ?? 0) + metric.value)
      })
      totalsInWorkout.forEach((total, key) => {
        const record = records.get(key)
        if (record) record.bestWorkout = Math.max(record.bestWorkout, total)
      })
    })

    return { ...streak, records: [...records.values()].sort((a, b) => a.name.localeCompare(b.name)) }
  }, [comps])

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
  if (unlocked.length === 0 && comps.length === 0 && live.records.length === 0) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>{t('achievementsTitle')}</div>
      <div className={styles.liveGrid}>
        <div className={styles.liveCard} title={`${t('streakBest')}: ${live.best}`}><Flame size={19} /><div><span>{t('streakTitle')}</span><b>{live.current}</b><small>{t('streakBest')}: {live.best}</small></div></div>
        <button className={styles.liveCard} type="button" onClick={() => setRecordsOpen((open) => !open)} aria-expanded={recordsOpen} title={t('recordsOpenHint')}><Award size={19} /><div><span>{t('recordsTitle')}</span><b>{live.records.length}</b><small>{t('recordsHint')}</small></div></button>
      </div>
      {recordsOpen && (
        <div className={styles.records} aria-label={t('recordsTitle')}>
          {live.records.map((record) => (
            <div key={record.name} className={styles.recordRow}>
              <b>{record.name}</b>
              <span>{t('bestSet')}: <strong>{record.bestSet}</strong></span>
              <span>{t('bestWorkout')}: <strong>{record.bestWorkout}</strong></span>
            </div>
          ))}
        </div>
      )}
      <div className={styles.grid}>
        {DEFS.map(({ id, icon: Icon, color, hint }) => {
          const ach = list.find((a) => a.id === id)
          const done = !!ach?.unlockedAt
          const isNew = newlyUnlocked.has(id)
          return (
            <div
              key={id}
              className={`${styles.badge} ${done ? styles.done : styles.locked} ${isNew ? styles.newBadge : ''}`}
              title={done ? ach!.unlockedAt!.slice(0, 10) : hint}
            >
              <div className={styles.iconWrap} style={done ? { background: `${color}22`, borderColor: color } : {}}>
                <Icon size={22} strokeWidth={1.5} color={done ? color : 'var(--border)'} />
              </div>
              <span className={styles.label}>{t(`ach_${id}` as Parameters<typeof t>[0])}</span>
              {!done && <span className={styles.hint}>{hint}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
