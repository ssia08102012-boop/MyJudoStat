import { useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Dumbbell, Pencil, Plus, Save, Target, Trash2 } from 'lucide-react'
import { getTrainingEntries, saveTrainingEntries } from '@/services/storage'
import { t } from '@/services/i18n'
import type { TrainingEntry, TrainingMetric } from '@/types'
import styles from './TrainingDiary.module.css'
import PeriodGoals from './PeriodGoals'
import ConfirmModal from '@/components/UI/ConfirmModal'
import ExerciseStats from './ExerciseStats'

interface Props { onBack: () => void }
type Draft = Pick<TrainingEntry, 'date' | 'focus' | 'notes'> & { metrics: TrainingMetric[] }

const makeMetric = (): TrainingMetric => ({ id: `m${Date.now()}${Math.random().toString(16).slice(2)}`, name: '', value: 0 })
const empty = (): Draft => ({ date: new Date().toISOString().slice(0, 10), focus: '', notes: '', metrics: [makeMetric()] })

function legacyMetrics(entry: TrainingEntry): TrainingMetric[] {
  const old = [
    ['throws', t('throws')], ['techniques', t('techniques')], ['fights', t('trainingFights')],
    ['pullUps', t('pullUps')], ['abs', t('abs')], ['bands', t('bands')],
  ] as const
  return old
    .map(([key, name]) => ({ id: `legacy-${key}`, name, value: Number(entry[key]) || 0 }))
    .filter((metric) => metric.value > 0)
}

function entryMetrics(entry: TrainingEntry): TrainingMetric[] {
  return entry.metrics?.filter((metric) => metric.name.trim()) ?? legacyMetrics(entry)
}

function toDraft(entry: TrainingEntry): Draft {
  return { date: entry.date, focus: entry.focus ?? '', notes: entry.notes ?? '', metrics: entryMetrics(entry).map((metric) => ({ ...metric })) }
}

function formatSavedAt(value: string | undefined): string {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

export default function TrainingDiary({ onBack }: Props) {
  const [entries, setEntries] = useState<TrainingEntry[]>(getTrainingEntries)
  const [form, setForm] = useState<Draft>(empty)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrainingEntry | null>(null)
  const categories = useMemo(() => [...new Set(entries.flatMap(entryMetrics).map(({ name }) => name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [entries])
  const changeMetric = (id: string, patch: Partial<TrainingMetric>) => setForm((draft) => ({ ...draft, metrics: draft.metrics.map((metric) => metric.id === id ? { ...metric, ...patch } : metric) }))
  const removeMetric = (id: string) => setForm((draft) => ({ ...draft, metrics: draft.metrics.filter((metric) => metric.id !== id) }))

  function startNew() { setEditingId(null); setForm(empty()); setOpen(true) }
  function startEdit(entry: TrainingEntry) { setEditingId(entry.id); setForm(toDraft(entry)); setOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function cancel() { setOpen(false); setEditingId(null); setForm(empty()) }
  function save() {
    const now = new Date().toISOString()
    const existing = entries.find((entry) => entry.id === editingId)
    const record: TrainingEntry = { id: existing?.id ?? `t${Date.now()}`, date: form.date, focus: form.focus?.trim(), notes: form.notes?.trim(), metrics: form.metrics.map((metric) => ({ ...metric, name: metric.name.trim(), value: Math.max(0, Number(metric.value) || 0) })).filter((metric) => metric.name), createdAt: existing?.createdAt ?? now, updatedAt: now }
    const next = existing ? entries.map((entry) => entry.id === existing.id ? record : entry) : [record, ...entries]
    next.sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    setEntries(next); saveTrainingEntries(next); cancel()
  }
  function deleteEntry() {
    if (!deleteTarget) return
    const next = entries.filter((entry) => entry.id !== deleteTarget.id)
    setEntries(next); saveTrainingEntries(next); setDeleteTarget(null)
  }

  return <main className={styles.page}>
    <header className={styles.pageHeader}>
      <button className={styles.back} onClick={onBack}><ArrowLeft size={17} /> {t('backToStats')}</button>
      <div><Dumbbell size={18} /><h1>{t('trainingDiary')}</h1></div>
      <button className={styles.add} onClick={startNew}><Plus size={17} /> {t('addTraining')}</button>
    </header>
    <p className={styles.intro}>{t('diaryIntro')}</p>
    <PeriodGoals />
    <ExerciseStats entries={entries} />
    {open && <section className={styles.editor}>
      <div className={styles.editorTitle}><CalendarDays size={16} /><b>{editingId ? t('editTraining') : t('newTraining')}</b></div>
      <label className={styles.dateField}>{t('trainingDate')}<input type="date" value={form.date} onChange={(e) => setForm((draft) => ({ ...draft, date: e.target.value }))} /></label>
      <div className={styles.metricsTitle}><span>{t('trainingMetrics')}</span><button type="button" onClick={() => setForm((draft) => ({ ...draft, metrics: [...draft.metrics, makeMetric()] }))}><Plus size={14} /> {t('addCategory')}</button></div>
      <datalist id="training-category-suggestions">{categories.map((category) => <option key={category} value={category} />)}</datalist>
      <div className={styles.metrics}>{form.metrics.map((metric) => <div className={styles.metric} key={metric.id}><input list="training-category-suggestions" value={metric.name} placeholder={t('categoryName')} onChange={(e) => changeMetric(metric.id, { name: e.target.value })} /><div className={styles.metricValues}><label>{t('quantity')}<input type="number" min="0" inputMode="numeric" value={metric.value} onChange={(e) => changeMetric(metric.id, { value: Math.max(0, Number(e.target.value) || 0) })} /></label><label>{t('bestSet')}<input type="number" min="0" inputMode="numeric" value={metric.bestSet ?? ''} placeholder="—" onChange={(e) => changeMetric(metric.id, { bestSet: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value) || 0) })} /></label></div><button type="button" aria-label={t('removeCategory')} onClick={() => removeMetric(metric.id)}><Trash2 size={15} /></button></div>)}</div>
      <input placeholder={t('trainingFocus')} value={form.focus} onChange={(e) => setForm((draft) => ({ ...draft, focus: e.target.value }))} />
      <textarea placeholder={t('trainingNotes')} value={form.notes} onChange={(e) => setForm((draft) => ({ ...draft, notes: e.target.value }))} />
      <div className={styles.editorActions}><button className={styles.cancel} onClick={cancel}>{t('cancel')}</button><button className={styles.save} onClick={save}><Save size={15} /> {t('saveTraining')}</button></div>
    </section>}
    {entries.length === 0 ? <div className={styles.empty}><Target size={20} /> {t('trainingEmpty')}</div> : <section className={styles.list}>{entries.map((entry) => <article key={entry.id}><div className={styles.entryHead}><div><b>{entry.date}</b><span>{entry.updatedAt && entry.createdAt !== entry.updatedAt ? `${t('editedAt')}: ${formatSavedAt(entry.updatedAt)}` : `${t('savedAt')}: ${formatSavedAt(entry.createdAt)}`}</span></div><div className={styles.entryActions}><button onClick={() => startEdit(entry)} aria-label={t('editTraining')}><Pencil size={15} /></button><button className={styles.delete} onClick={() => setDeleteTarget(entry)} aria-label={t('deleteTraining')}><Trash2 size={15} /></button></div></div>{entryMetrics(entry).length > 0 && <div className={styles.entryMetrics}>{entryMetrics(entry).map((metric) => <span key={metric.id}><b>{metric.value}</b> {metric.name}</span>)}</div>}{entry.focus && <p><b>{t('trainingFocus')}:</b> {entry.focus}</p>}{entry.notes && <p className={styles.notes}>{entry.notes}</p>}</article>)}</section>}
    <ConfirmModal open={Boolean(deleteTarget)} message={t('confirmDeleteTraining')} danger onConfirm={deleteEntry} onCancel={() => setDeleteTarget(null)} />
  </main>
}
