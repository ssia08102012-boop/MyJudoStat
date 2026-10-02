import { useEffect, useState } from 'react'
import { Check, CheckCircle2, Circle, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { getPeriodGoals, savePeriodGoals } from '@/services/storage'
import { t } from '@/services/i18n'
import type { PeriodGoal } from '@/types'
import styles from './PeriodGoals.module.css'
import ConfirmModal from '@/components/UI/ConfirmModal'

type Draft = Pick<PeriodGoal, 'title' | 'deadline' | 'note'>
const empty = (): Draft => ({ title: '', deadline: '', note: '' })

function timeLeft(deadline: string, now: Date): { key: 'deadlineIn' | 'deadlineToday' | 'deadlinePassed'; value?: string } {
  const until = new Date(`${deadline}T23:59:59`).getTime() - now.getTime()
  if (until < 0) return { key: 'deadlinePassed' }
  const days = Math.floor(until / 86_400_000)
  const hours = Math.floor((until % 86_400_000) / 3_600_000)
  if (days === 0) return { key: 'deadlineToday', value: `${hours} ${t('hoursShort')}` }
  return { key: 'deadlineIn', value: `${days} ${t('daysShort')} ${hours} ${t('hoursShort')}` }
}

export default function PeriodGoals() {
  const [goals, setGoals] = useState<PeriodGoal[]>(getPeriodGoals)
  const [form, setForm] = useState<Draft>(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [deleteTarget, setDeleteTarget] = useState<PeriodGoal | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  function startNew() { setForm(empty()); setEditingId(null); setOpen(true) }
  function startEdit(goal: PeriodGoal) { setForm({ title: goal.title, deadline: goal.deadline, note: goal.note ?? '' }); setEditingId(goal.id); setOpen(true) }
  function close() { setOpen(false); setEditingId(null); setForm(empty()) }
  function save() {
    if (!form.title.trim() || !form.deadline) return
    const current = goals.find((goal) => goal.id === editingId)
    const goal: PeriodGoal = { id: current?.id ?? `g${Date.now()}`, title: form.title.trim(), deadline: form.deadline, note: form.note?.trim(), createdAt: current?.createdAt ?? new Date().toISOString(), completedAt: current?.completedAt }
    const next = current ? goals.map((item) => item.id === goal.id ? goal : item) : [...goals, goal]
    next.sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)) || a.deadline.localeCompare(b.deadline))
    setGoals(next); savePeriodGoals(next); close()
  }
  function toggleDone(goal: PeriodGoal) {
    const next = goals.map((item) => item.id === goal.id ? { ...item, completedAt: item.completedAt ? undefined : new Date().toISOString() } : item)
    next.sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)) || a.deadline.localeCompare(b.deadline))
    setGoals(next); savePeriodGoals(next)
  }
  function deleteGoal() {
    if (!deleteTarget) return
    const next = goals.filter((goal) => goal.id !== deleteTarget.id)
    setGoals(next); savePeriodGoals(next); setDeleteTarget(null)
  }

  return <section className={styles.wrap}>
    <div className={styles.header}><div><Target size={17} /><h2>{t('periodGoals')}</h2></div><button onClick={startNew}><Plus size={15} /> {t('addGoal')}</button></div>
    {open && <div className={styles.editor}>
      <b>{editingId ? t('editPeriodGoal') : t('newPeriodGoal')}</b>
      <input value={form.title} placeholder={t('goalName')} onChange={(e) => setForm((draft) => ({ ...draft, title: e.target.value }))} />
      <label>{t('deadline')}<input type="date" value={form.deadline} onChange={(e) => setForm((draft) => ({ ...draft, deadline: e.target.value }))} /></label>
      <textarea value={form.note} placeholder={t('goalNote')} onChange={(e) => setForm((draft) => ({ ...draft, note: e.target.value }))} />
      <div><button className={styles.cancel} onClick={close}>{t('cancel')}</button><button className={styles.save} disabled={!form.title.trim() || !form.deadline} onClick={save}><Check size={15} /> {t('saveGoal')}</button></div>
    </div>}
    {goals.length === 0 ? <div className={styles.empty}>{t('periodGoalsEmpty')}</div> : <div className={styles.list}>{goals.map((goal) => {
      const left = timeLeft(goal.deadline, now)
      return <article key={goal.id} className={goal.completedAt ? styles.done : ''}>
        <button className={styles.doneButton} aria-label={t('goalCompleted')} onClick={() => toggleDone(goal)}>{goal.completedAt ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button>
        <div className={styles.goal}><b>{goal.title}</b><span>{t('deadline')}: {goal.deadline}</span>{goal.note && <small>{goal.note}</small>}<em className={left.key === 'deadlinePassed' ? styles.overdue : ''}>{t(left.key)}{left.value ? `: ${left.value}` : ''}</em></div>
        <div className={styles.actions}><button className={styles.edit} aria-label={t('editPeriodGoal')} onClick={() => startEdit(goal)}><Pencil size={15} /></button><button className={styles.delete} aria-label={t('deleteGoal')} onClick={() => setDeleteTarget(goal)}><Trash2 size={15} /></button></div>
      </article>
    })}</div>}
    <ConfirmModal open={Boolean(deleteTarget)} message={t('confirmDeleteGoal')} danger onConfirm={deleteGoal} onCancel={() => setDeleteTarget(null)} />
  </section>
}
