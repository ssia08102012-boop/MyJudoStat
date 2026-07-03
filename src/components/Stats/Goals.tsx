import { useState, useEffect } from 'react'
import { Target, Check } from 'lucide-react'
import { t } from '@/services/i18n'
import { getGoal, saveGoal, calcStats } from '@/services/storage'
import type { Tournament } from '@/types'
import styles from './Goals.module.css'

interface Props {
  comps: Tournament[]
  activeYear: number | 'all'
}

export default function Goals({ comps, activeYear }: Props) {
  const [editing, setEditing] = useState(false)
  const [targetInput, setTargetInput] = useState('80')
  const [goal, setGoal] = useState(getGoal())

  const currentYear = new Date().getFullYear()
  const year = activeYear === 'all' ? currentYear : activeYear
  const yearComps = comps.filter((c) => c.year === year)
  const s = calcStats(yearComps)
  const currentWR = s.fights > 0 ? Math.round((s.wins / s.fights) * 100) : 0

  useEffect(() => {
    const g = getGoal()
    setGoal(g)
    if (g) setTargetInput(String(g.targetWinRate))
  }, [])

  function handleSave() {
    const target = Math.min(100, Math.max(1, parseInt(targetInput) || 80))
    const newGoal = { year, targetWinRate: target }
    saveGoal(newGoal)
    setGoal(newGoal)
    setEditing(false)
  }

  const target = goal?.targetWinRate ?? 80
  const achieved = goal ? currentWR >= target : false
  const progress = Math.min(100, Math.round((currentWR / target) * 100))

  if (!goal && !editing) {
    return (
      <div className={styles.wrap}>
        <button className={styles.setGoalBtn} onClick={() => setEditing(true)}>
          <Target size={14} />
          {t('goalSet')} {year}
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div className={styles.wrap}>
        <div className={styles.editRow}>
          <Target size={14} color="var(--orange)" />
          <span className={styles.editLabel}>{t('goalTarget')} {year}:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            className={styles.targetInput}
            autoFocus
          />
          <span>%</span>
          <button className={styles.saveBtn} onClick={handleSave}><Check size={14} /></button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Target size={14} color="var(--orange)" />
          <span>{t('goalTitle')} {year}: <b>{target}%</b></span>
          {achieved && <span className={styles.achieved}>✓</span>}
        </div>
        <button className={styles.editBtn} onClick={() => setEditing(true)}>{t('goalEdit')}</button>
      </div>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${achieved ? styles.fillDone : ''}`}
          style={{ width: `${progress}%` }}
        />
        <div className={styles.marker} style={{ left: `${Math.min(98, target)}%` }} />
      </div>
      <div className={styles.labels}>
        <span className={styles.current}>{currentWR}%</span>
        <span className={styles.fights}>{s.wins}W / {s.losses}L · {s.fights} {t('goalFightsStat')}</span>
      </div>
    </div>
  )
}
