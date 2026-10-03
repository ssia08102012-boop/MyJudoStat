import { useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Dumbbell, FileDown, Pencil, Plus, Save, Target, Trash2 } from 'lucide-react'
import { getTrainingEntries, saveTrainingEntries } from '@/services/storage'
import { t } from '@/services/i18n'
import type { Profile, TrainingEntry, TrainingMetric } from '@/types'
import styles from './TrainingDiary.module.css'
import PeriodGoals from './PeriodGoals'
import ConfirmModal from '@/components/UI/ConfirmModal'
import ExerciseStats from './ExerciseStats'
import DiaryReportModal from './DiaryReportModal'

interface Props { onBack: () => void, profile: Profile, showToast: (message: string) => void }
type Draft = Pick<TrainingEntry, 'date' | 'focus' | 'notes'> & { metrics: TrainingMetric[] }

const makeMetric = (): TrainingMetric => ({ id: `m${Date.now()}${Math.random().toString(16).slice(2)}`, name: '', value: 0, sets: [0] })
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
  return { date: entry.date, focus: entry.focus ?? '', notes: entry.notes ?? '', metrics: entryMetrics(entry).map((metric) => ({ ...metric, sets: metric.sets?.length ? metric.sets : [metric.value] })) }
}

function formatSavedAt(value: string | undefined): string {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

export default function TrainingDiary({ onBack, profile, showToast }: Props) {
  const [entries, setEntries] = useState<TrainingEntry[]>(getTrainingEntries)
  const [form, setForm] = useState<Draft>(empty)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrainingEntry | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const categories = useMemo(() => [...new Set(entries.flatMap(entryMetrics).map(({ name }) => name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [entries])
  const changeMetric = (id: string, patch: Partial<TrainingMetric>) => setForm((draft) => ({ ...draft, metrics: draft.metrics.map((metric) => metric.id === id ? { ...metric, ...patch } : metric) }))
  const removeMetric = (id: string) => setForm((draft) => ({ ...draft, metrics: draft.metrics.filter((metric) => metric.id !== id) }))
  const changeSet = (id: string, index: number, value: string) => setForm((draft) => ({ ...draft, metrics: draft.metrics.map((metric) => metric.id === id ? { ...metric, sets: (metric.sets ?? [metric.value]).map((set, setIndex) => setIndex === index ? Math.max(0, Number(value) || 0) : set) } : metric) }))
  const addSet = (id: string) => setForm((draft) => ({ ...draft, metrics: draft.metrics.map((metric) => metric.id === id ? { ...metric, sets: [...(metric.sets ?? [metric.value]), 0] } : metric) }))
  const removeSet = (id: string, index: number) => setForm((draft) => ({ ...draft, metrics: draft.metrics.map((metric) => metric.id === id ? { ...metric, sets: (metric.sets ?? [metric.value]).filter((_, setIndex) => setIndex !== index) } : metric) }))

  function startNew() { setEditingId(null); setForm(empty()); setOpen(true) }
  function startEdit(entry: TrainingEntry) { setEditingId(entry.id); setForm(toDraft(entry)); setOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function cancel() { setOpen(false); setEditingId(null); setForm(empty()) }
  function save() {
    const now = new Date().toISOString()
    const existing = entries.find((entry) => entry.id === editingId)
    const record: TrainingEntry = { id: existing?.id ?? `t${Date.now()}`, date: form.date, focus: form.focus?.trim(), notes: form.notes?.trim(), metrics: form.metrics.map((metric) => { const sets = (metric.sets ?? [metric.value]).map((value) => Math.max(0, Number(value) || 0)); return { ...metric, name: metric.name.trim(), sets, value: sets.reduce((total, value) => total + value, 0), bestSet: Math.max(...sets, 0) } }).filter((metric) => metric.name), createdAt: existing?.createdAt ?? now, updatedAt: now }
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
      <div className={styles.headerActions}><button className={styles.report} onClick={() => setReportOpen(true)}><FileDown size={16} /> {t('exportDiary')}</button><button className={styles.add} onClick={startNew}><Plus size={17} /> {t('addTraining')}</button></div>
    </header>
    <p className={styles.intro}>{t('diaryIntro')}</p>
    <PeriodGoals />
    <ExerciseStats entries={entries} />
    {open && <section className={styles.editor}>
      <div className={styles.editorTitle}><CalendarDays size={16} /><b>{editingId ? t('editTraining') : t('newTraining')}</b></div>
      <label className={styles.dateField}>{t('trainingDate')}<input type="date" value={form.date} onChange={(e) => setForm((draft) => ({ ...draft, date: e.target.value }))} /></label>
      <div className={styles.metricsTitle}><span>{t('trainingMetrics')}</span><button type="button" onClick={() => setForm((draft) => ({ ...draft, metrics: [...draft.metrics, makeMetric()] }))}><Plus size={14} /> {t('addCategory')}</button></div>
      <datalist id="training-category-suggestions">{categories.map((category) => <option key={category} value={category} />)}</datalist>
      <div className={styles.metrics}>{form.metrics.map((metric) => { const sets = metric.sets ?? [metric.value]; const total = sets.reduce((sum, value) => sum + value, 0); return <div className={styles.metric} key={metric.id}><input list="training-category-suggestions" value={metric.name} placeholder={t('categoryName')} onChange={(e) => changeMetric(metric.id, { name: e.target.value })} /><div className={styles.sets}>{sets.map((value, index) => <div className={styles.setRow} key={`${metric.id}-${index}`}><span>{t('setNumber')} {index + 1}</span><input type="number" min="0" inputMode="numeric" value={value || ''} aria-label={`${t('setNumber')} ${index + 1}`} onChange={(e) => changeSet(metric.id, index, e.target.value)} />{sets.length > 1 && <button type="button" aria-label={t('removeSet')} onClick={() => removeSet(metric.id, index)}><Trash2 size={13} /></button>}</div>)}<button className={styles.addSet} type="button" onClick={() => addSet(metric.id)}><Plus size={13} /> {t('addSet')}</button><b className={styles.metricTotal}>{t('trainingTotal')}: {total}</b></div><button type="button" aria-label={t('removeCategory')} onClick={() => removeMetric(metric.id)}><Trash2 size={15} /></button></div> })}</div>
      <input placeholder={t('trainingFocus')} value={form.focus} onChange={(e) => setForm((draft) => ({ ...draft, focus: e.target.value }))} />
      <textarea placeholder={t('trainingNotes')} value={form.notes} onChange={(e) => setForm((draft) => ({ ...draft, notes: e.target.value }))} />
      <div className={styles.editorActions}><button className={styles.cancel} onClick={cancel}>{t('cancel')}</button><button className={styles.save} onClick={save}><Save size={15} /> {t('saveTraining')}</button></div>
    </section>}
    {entries.length === 0 ? <div className={styles.empty}><Target size={20} /> {t('trainingEmpty')}</div> : <section className={styles.list}>{entries.map((entry) => <article key={entry.id}><div className={styles.entryHead}><div><b>{entry.date}</b><span>{entry.updatedAt && entry.createdAt !== entry.updatedAt ? `${t('editedAt')}: ${formatSavedAt(entry.updatedAt)}` : `${t('savedAt')}: ${formatSavedAt(entry.createdAt)}`}</span></div><div className={styles.entryActions}><button onClick={() => startEdit(entry)} aria-label={t('editTraining')}><Pencil size={15} /></button><button className={styles.delete} onClick={() => setDeleteTarget(entry)} aria-label={t('deleteTraining')}><Trash2 size={15} /></button></div></div>{entryMetrics(entry).length > 0 && <div className={styles.entryMetrics}>{entryMetrics(entry).map((metric) => <span key={metric.id}><b>{metric.value}</b> {metric.name}{metric.sets && metric.sets.length > 1 && <small> · {metric.sets.join(' + ')}</small>}</span>)}</div>}{entry.focus && <p><b>{t('trainingFocus')}:</b> {entry.focus}</p>}{entry.notes && <p className={styles.notes}>{entry.notes}</p>}</article>)}</section>}
    <ConfirmModal open={Boolean(deleteTarget)} message={t('confirmDeleteTraining')} danger onConfirm={deleteEntry} onCancel={() => setDeleteTarget(null)} />
    <DiaryReportModal open={reportOpen} entries={entries} profile={profile} onClose={() => setReportOpen(false)} showToast={showToast} />
  </main>
}
