import { useState } from 'react'
import { Dumbbell, Plus, Swords, Target } from 'lucide-react'
import { getTrainingEntries, saveTrainingEntries } from '@/services/storage'
import { t } from '@/services/i18n'
import type { TrainingEntry } from '@/types'
import styles from './TrainingDiary.module.css'

const empty = (): TrainingEntry => ({ id: `t${Date.now()}`, date: new Date().toISOString().slice(0, 10), throws: 0, techniques: 0, fights: 0, focus: '', notes: '', pullUps: 0, abs: 0, bands: 0 })

export default function TrainingDiary() {
  const [entries, setEntries] = useState<TrainingEntry[]>(getTrainingEntries)
  const [form, setForm] = useState<TrainingEntry>(empty)
  const [open, setOpen] = useState(false)
  const set = (key: keyof TrainingEntry, value: string) => setForm((entry) => ({ ...entry, [key]: ['throws', 'techniques', 'fights', 'pullUps', 'abs', 'bands'].includes(key) ? Math.max(0, Number(value) || 0) : value }))
  function save() { const next = [form, ...entries]; setEntries(next); saveTrainingEntries(next); setForm(empty()); setOpen(false) }
  return <div className={styles.wrap}>
    <div className={styles.header}><div><Dumbbell size={16} /><span>{t('trainingDiary')}</span></div><button onClick={() => setOpen((v) => !v)}><Plus size={15} /> {t('addTraining')}</button></div>
    {open && <div className={styles.form}>
      <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
      <div className={styles.numbers}>{[['throws','throws'],['techniques','techniques'],['fights','trainingFights'],['pullUps','pullUps'],['abs','abs'],['bands','bands']].map(([key,label]) => <label key={key}>{t(label as Parameters<typeof t>[0])}<input type="number" min="0" value={form[key as keyof TrainingEntry] as number} onChange={(e) => set(key as keyof TrainingEntry,e.target.value)} /></label>)}</div>
      <input placeholder={t('trainingFocus')} value={form.focus} onChange={(e) => set('focus', e.target.value)} />
      <textarea placeholder={t('trainingNotes')} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      <button className={styles.save} onClick={save}>{t('saveTraining')}</button>
    </div>}
    {entries.length === 0 ? <div className={styles.empty}><Target size={18} /> {t('trainingEmpty')}</div> : <div className={styles.list}>{entries.slice(0, 5).map((entry) => <article key={entry.id}><b>{entry.date}</b><span><Swords size={13} /> {entry.throws} {t('throws').toLowerCase()} · {entry.techniques} {t('techniques').toLowerCase()} · {entry.fights} {t('trainingFights').toLowerCase()}</span>{entry.focus && <small>{entry.focus}</small>}</article>)}</div>}
  </div>
}
