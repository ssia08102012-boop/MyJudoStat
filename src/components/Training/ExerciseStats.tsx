import { useMemo, useState } from 'react'
import { BarChart3, Medal, Trophy } from 'lucide-react'
import { t } from '@/services/i18n'
import type { TrainingEntry } from '@/types'
import styles from './ExerciseStats.module.css'

interface Props { entries: TrainingEntry[] }
type Range = '30d' | '6m' | '1y' | 'all'
type Summary = { name: string; total: number; bestWorkout: number; bestSet?: number; days: number }

function metricsOf(entry: TrainingEntry) {
  if (entry.metrics) return entry.metrics
  return [
    ['throws', t('throws')], ['techniques', t('techniques')], ['fights', t('trainingFights')],
    ['pullUps', t('pullUps')], ['abs', t('abs')], ['bands', t('bands')],
  ].map(([key, name]) => ({ id: `legacy-${key}`, name, value: Number(entry[key as keyof TrainingEntry]) || 0, bestSet: undefined }))
}

function inRange(date: string, range: Range): boolean {
  if (range === 'all') return true
  const start = new Date()
  if (range === '30d') start.setDate(start.getDate() - 30)
  if (range === '6m') start.setMonth(start.getMonth() - 6)
  if (range === '1y') start.setFullYear(start.getFullYear() - 1)
  return new Date(`${date}T23:59:59`) >= start
}

function summaries(entries: TrainingEntry[], range: Range): Summary[] {
  const totals = new Map<string, { name: string; total: number; bestWorkout: number; bestSet?: number; days: Set<string> }>()
  const perDay = new Map<string, number>()
  for (const entry of entries.filter((item) => inRange(item.date, range))) {
    for (const metric of metricsOf(entry)) {
      const name = metric.name.trim()
      if (!name) continue
      const key = name.toLocaleLowerCase()
      perDay.set(`${key}|${entry.date}`, (perDay.get(`${key}|${entry.date}`) ?? 0) + metric.value)
      const current = totals.get(key) ?? { name, total: 0, bestWorkout: 0, bestSet: undefined, days: new Set<string>() }
      current.total += metric.value
      current.days.add(entry.date)
      if (metric.bestSet !== undefined) current.bestSet = Math.max(current.bestSet ?? 0, metric.bestSet)
      totals.set(key, current)
    }
  }
  for (const [keyAndDate, value] of perDay) {
    const key = keyAndDate.split('|')[0]
    const item = totals.get(key)
    if (item) item.bestWorkout = Math.max(item.bestWorkout, value)
  }
  return [...totals.values()].map(({ days, ...item }) => ({ ...item, days: days.size })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
}

export default function ExerciseStats({ entries }: Props) {
  const [range, setRange] = useState<Range>('6m')
  const [selected, setSelected] = useState('')
  const data = useMemo(() => summaries(entries, range), [entries, range])
  const active = data.find((item) => item.name.toLocaleLowerCase() === selected) ?? data[0]

  return <section className={styles.wrap}>
    <div className={styles.header}><div><BarChart3 size={17} /><h2>{t('exerciseStats')}</h2></div></div>
    <div className={styles.filters}>{(['30d', '6m', '1y', 'all'] as Range[]).map((item) => <button key={item} className={range === item ? styles.active : ''} onClick={() => setRange(item)}>{t(`range_${item}` as Parameters<typeof t>[0])}</button>)}</div>
    {data.length === 0 ? <div className={styles.empty}>{t('exerciseStatsEmpty')}</div> : <>
      <div className={styles.exerciseList}>{data.map((item) => <button key={item.name} className={active?.name === item.name ? styles.selected : ''} onClick={() => setSelected(item.name.toLocaleLowerCase())}><span>{item.name}</span><b>{item.total}</b></button>)}</div>
      {active && <><div className={styles.selectedTitle}>{t('selectedExercise')}: <b>{active.name}</b></div><div className={styles.cards}>
        <div><BarChart3 size={17} /><span>{t('totalVolume')}</span><b>{active.total}</b><small>{t('trainingDays')}: {active.days}</small></div>
        <div><Trophy size={17} /><span>{t('bestWorkout')}</span><b>{active.bestWorkout}</b><small>{t('bestWorkoutHint')}</small></div>
        <div><Medal size={17} /><span>{t('bestSet')}</span><b>{active.bestSet ?? '—'}</b><small>{active.bestSet === undefined ? t('bestSetEmpty') : t('bestSetHint')}</small></div>
      </div></>}
    </>}
  </section>
}
