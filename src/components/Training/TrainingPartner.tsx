import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Pencil, Plus, Target, Trash2, UsersRound } from 'lucide-react'
import { getPartnerData, savePartnerData } from '@/services/storage'
import { t } from '@/services/i18n'
import type { PartnerData, TrainingEntry, TrainingMetric } from '@/types'
import ConfirmModal from '@/components/UI/ConfirmModal'
import styles from './TrainingPartner.module.css'

interface Props { entries: TrainingEntry[]; onBack: () => void }
type Range = '30d' | '6m' | '1y' | 'all'
type Draft = { date: string; name: string; sets: number[] }
const empty = (): Draft => ({ date: new Date().toISOString().slice(0, 10), name: '', sets: [0] })

function inRange(date: string, range: Range): boolean {
  if (range === 'all') return true
  const start = new Date()
  if (range === '30d') start.setDate(start.getDate() - 30)
  if (range === '6m') start.setMonth(start.getMonth() - 6)
  if (range === '1y') start.setFullYear(start.getFullYear() - 1)
  return new Date(`${date}T23:59:59`) >= start
}
function namesOf(entries: TrainingEntry[]): string[] {
  return entries.flatMap((entry) => entry.metrics ?? []).map((metric) => metric.name.trim()).filter(Boolean)
}
function volume(entries: TrainingEntry[], name: string, range: Range): number {
  const key = name.toLocaleLowerCase()
  return entries.filter((entry) => inRange(entry.date, range)).flatMap((entry) => entry.metrics ?? []).filter((metric) => metric.name.trim().toLocaleLowerCase() === key).reduce((total, metric) => total + metric.value, 0)
}

export default function TrainingPartner({ entries, onBack }: Props) {
  const [partner, setPartner] = useState<PartnerData>(getPartnerData)
  const [nameInput, setNameInput] = useState(getPartnerData().name)
  const [editingName, setEditingName] = useState(!getPartnerData().name)
  const [draft, setDraft] = useState<Draft>(empty)
  const [formOpen, setFormOpen] = useState(false)
  const [range, setRange] = useState<Range>('6m')
  const [selected, setSelected] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<TrainingEntry | null>(null)
  const categories = useMemo(() => [...new Set([...namesOf(entries), ...namesOf(partner.entries)])].sort((a, b) => a.localeCompare(b)), [entries, partner.entries])
  const active = categories.find((name) => name.toLocaleLowerCase() === selected) ?? categories[0]

  function saveName() { const next = { ...partner, name: nameInput.trim() }; setPartner(next); savePartnerData(next); setEditingName(false) }
  function addSet() { setDraft((item) => ({ ...item, sets: [...item.sets, 0] })) }
  function updateSet(index: number, raw: string) { setDraft((item) => ({ ...item, sets: item.sets.map((value, itemIndex) => itemIndex === index ? Math.max(0, Number(raw) || 0) : value) })) }
  function removeSet(index: number) { setDraft((item) => ({ ...item, sets: item.sets.filter((_, itemIndex) => itemIndex !== index) })) }
  function saveEntry() {
    if (!draft.name.trim()) return
    const sets = draft.sets.map((value) => Math.max(0, value))
    const metric: TrainingMetric = { id: `pm${Date.now()}`, name: draft.name.trim(), sets, value: sets.reduce((total, value) => total + value, 0), bestSet: Math.max(...sets, 0) }
    const entry: TrainingEntry = { id: `p${Date.now()}`, date: draft.date, metrics: [metric], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const next = { ...partner, entries: [entry, ...partner.entries].sort((a, b) => b.date.localeCompare(a.date)) }
    setPartner(next); savePartnerData(next); setDraft(empty()); setFormOpen(false)
  }
  function deleteEntry() {
    if (!deleteTarget) return
    const next = { ...partner, entries: partner.entries.filter((entry) => entry.id !== deleteTarget.id) }
    setPartner(next); savePartnerData(next); setDeleteTarget(null)
  }
  const myVolume = active ? volume(entries, active, range) : 0
  const partnerVolume = active ? volume(partner.entries, active, range) : 0

  return <main className={styles.page}>
    <header className={styles.header}><button onClick={onBack}><ArrowLeft size={17} /> {t('backToStats')}</button><div><UsersRound size={18} /><h1>{t('trainingPartner')}</h1></div></header>
    <section className={styles.profile}><div><span>{t('partnerName')}</span>{editingName ? <input value={nameInput} placeholder={t('partnerName')} onChange={(e) => setNameInput(e.target.value)} /> : <b>{partner.name}</b>}</div><button onClick={() => editingName ? saveName() : setEditingName(true)}>{editingName ? <><Check size={15} /> {t('save')}</> : <><Pencil size={15} /> {t('editPartner')}</>}</button></section>
    {partner.name && <>
      <section className={styles.compare}><div className={styles.compareHead}><Target size={16} /><h2>{t('partnerComparison')}</h2></div><div className={styles.filters}>{(['30d', '6m', '1y', 'all'] as Range[]).map((item) => <button key={item} className={range === item ? styles.active : ''} onClick={() => setRange(item)}>{t(`range_${item}` as Parameters<typeof t>[0])}</button>)}</div>{categories.length === 0 ? <p>{t('partnerComparisonEmpty')}</p> : <><div className={styles.categories}>{categories.map((name) => <button key={name} className={active === name ? styles.selected : ''} onClick={() => setSelected(name.toLocaleLowerCase())}>{name}</button>)}</div><div className={styles.score}><div className={myVolume >= partnerVolume ? styles.winner : ''}><span>{t('me')}</span><b>{myVolume}</b></div><div className={partnerVolume > myVolume ? styles.winner : ''}><span>{partner.name}</span><b>{partnerVolume}</b></div></div></>}</section>
      <section className={styles.entries}><div className={styles.entryHead}><h2>{t('partnerResults')}</h2><button onClick={() => setFormOpen((open) => !open)}><Plus size={15} /> {t('addTraining')}</button></div>{formOpen && <div className={styles.form}><input type="date" value={draft.date} onChange={(e) => setDraft((item) => ({ ...item, date: e.target.value }))} /><input list="partner-category-suggestions" value={draft.name} placeholder={t('categoryName')} onChange={(e) => setDraft((item) => ({ ...item, name: e.target.value }))} /><datalist id="partner-category-suggestions">{categories.map((category) => <option key={category} value={category} />)}</datalist><div className={styles.sets}>{draft.sets.map((value, index) => <div key={index}><span>{t('setNumber')} {index + 1}</span><input type="number" min="0" inputMode="numeric" value={value || ''} onChange={(e) => updateSet(index, e.target.value)} />{draft.sets.length > 1 && <button aria-label={t('removeSet')} onClick={() => removeSet(index)}><Trash2 size={13} /></button>}</div>)}<button className={styles.addSet} onClick={addSet}><Plus size={13} /> {t('addSet')}</button></div><b>{t('trainingTotal')}: {draft.sets.reduce((total, value) => total + value, 0)}</b><button className={styles.save} disabled={!draft.name.trim()} onClick={saveEntry}>{t('saveTraining')}</button></div>}{partner.entries.length === 0 ? <p className={styles.empty}>{t('partnerEntriesEmpty')}</p> : <div className={styles.list}>{partner.entries.map((entry) => <article key={entry.id}><div><b>{entry.date}</b>{entry.metrics?.map((metric) => <span key={metric.id}>{metric.name}: <strong>{metric.value}</strong>{metric.sets && metric.sets.length > 1 && <small> · {metric.sets.join(' + ')}</small>}</span>)}</div><button aria-label={t('deleteTraining')} onClick={() => setDeleteTarget(entry)}><Trash2 size={15} /></button></article>)}</div>}</section>
    </>}
    <ConfirmModal open={Boolean(deleteTarget)} message={t('confirmDeletePartnerTraining')} danger onConfirm={deleteEntry} onCancel={() => setDeleteTarget(null)} />
  </main>
}
