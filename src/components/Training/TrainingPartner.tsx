import { useEffect, useMemo, useState } from 'react'
import { Archive, ArchiveRestore, ArrowLeft, Check, ChevronDown, ImagePlus, Pencil, Plus, Target, Trash2, UsersRound } from 'lucide-react'
import { getPartnerData, loadPhoto, savePartnerData, savePhoto } from '@/services/storage'
import { t } from '@/services/i18n'
import type { PartnerData, TrainingEntry, TrainingMetric, TrainingPartner } from '@/types'
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
function namesOf(entries: TrainingEntry[]): string[] { return entries.flatMap((entry) => entry.metrics ?? []).map((metric) => metric.name.trim()).filter(Boolean) }
function volume(entries: TrainingEntry[], name: string, range: Range): number { const key = name.toLocaleLowerCase(); return entries.filter((entry) => inRange(entry.date, range)).flatMap((entry) => entry.metrics ?? []).filter((metric) => metric.name.trim().toLocaleLowerCase() === key).reduce((total, metric) => total + metric.value, 0) }

export default function TrainingPartner({ entries, onBack }: Props) {
  const [data, setData] = useState<PartnerData>(getPartnerData)
  const [selectedId, setSelectedId] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(empty)
  const [formOpen, setFormOpen] = useState(false)
  const [range, setRange] = useState<Range>('6m')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [deleteEntryTarget, setDeleteEntryTarget] = useState<TrainingEntry | null>(null)
  const [deletePartnerTarget, setDeletePartnerTarget] = useState<TrainingPartner | null>(null)
  const [showArchive, setShowArchive] = useState(false)
  const activePartners = data.partners.filter((partner) => !partner.archivedAt)
  const archivedPartners = data.partners.filter((partner) => partner.archivedAt)
  const partner = activePartners.find((item) => item.id === selectedId) ?? activePartners[0]
  const categories = useMemo(() => [...new Set([...namesOf(entries), ...namesOf(partner?.entries ?? [])])].sort((a, b) => a.localeCompare(b)), [entries, partner?.entries])
  const activeExercise = categories.find((name) => name.toLocaleLowerCase() === selectedExercise) ?? categories[0]

  useEffect(() => {
    if (!selectedId && activePartners[0]) setSelectedId(activePartners[0].id)
  }, [activePartners, selectedId])
  useEffect(() => {
    let cancelled = false
    void Promise.all(data.partners.map(async (item) => ({ id: item.id, photo: await loadPhoto(`partner_photo_${item.id}`) }))).then((photos) => {
      if (cancelled || !photos.some((item) => item.photo)) return
      setData((current) => ({ ...current, partners: current.partners.map((item) => ({ ...item, photo: photos.find((photo) => photo.id === item.id)?.photo ?? item.photo })) }))
    })
    return () => { cancelled = true }
  }, [data.partners.length])

  function persist(next: PartnerData) { setData(next); savePartnerData(next) }
  function addPartner() {
    const name = nameInput.trim()
    if (!name || activePartners.length >= 5) return
    const newPartner: TrainingPartner = { id: `partner-${Date.now()}`, name, entries: [] }
    persist({ ...data, partners: [...data.partners, newPartner] }); setSelectedId(newPartner.id); setNameInput(''); setAdding(false)
  }
  function updatePartner(id: string, patch: Partial<TrainingPartner>) { persist({ ...data, partners: data.partners.map((item) => item.id === id ? { ...item, ...patch } : item) }) }
  function saveName() { if (partner && nameInput.trim()) { updatePartner(partner.id, { name: nameInput.trim() }); setEditingName(false) } }
  async function addPhoto(file: File | undefined) {
    if (!partner || !file) return
    const reader = new FileReader()
    reader.onload = async (event) => { const photo = event.target?.result as string; await savePhoto(`partner_photo_${partner.id}`, photo); updatePartner(partner.id, { photo }) }
    reader.readAsDataURL(file)
  }
  function addSet() { setDraft((item) => ({ ...item, sets: [...item.sets, 0] })) }
  function updateSet(index: number, raw: string) { setDraft((item) => ({ ...item, sets: item.sets.map((value, itemIndex) => itemIndex === index ? Math.max(0, Number(raw) || 0) : value) })) }
  function removeSet(index: number) { setDraft((item) => ({ ...item, sets: item.sets.filter((_, itemIndex) => itemIndex !== index) })) }
  function saveEntry() {
    if (!partner || !draft.name.trim()) return
    const sets = draft.sets.map((value) => Math.max(0, value)); const now = new Date().toISOString()
    const metric: TrainingMetric = { id: `pm${Date.now()}`, name: draft.name.trim(), sets, value: sets.reduce((total, value) => total + value, 0), bestSet: Math.max(...sets, 0) }
    const entry: TrainingEntry = { id: `p${Date.now()}`, date: draft.date, metrics: [metric], createdAt: now, updatedAt: now }
    updatePartner(partner.id, { entries: [entry, ...partner.entries].sort((a, b) => b.date.localeCompare(a.date)) }); setDraft(empty()); setFormOpen(false)
  }
  function deleteEntry() { if (partner && deleteEntryTarget) { updatePartner(partner.id, { entries: partner.entries.filter((entry) => entry.id !== deleteEntryTarget.id) }); setDeleteEntryTarget(null) } }
  function archivePartner() { if (partner) { updatePartner(partner.id, { archivedAt: new Date().toISOString() }); setSelectedId('') } }
  function restorePartner(item: TrainingPartner) { if (activePartners.length >= 5) return; updatePartner(item.id, { archivedAt: undefined }); setSelectedId(item.id); setShowArchive(false) }
  function deletePartner() { if (deletePartnerTarget) { persist({ ...data, partners: data.partners.filter((item) => item.id !== deletePartnerTarget.id) }); setDeletePartnerTarget(null) } }
  const myVolume = activeExercise ? volume(entries, activeExercise, range) : 0
  const partnerVolume = activeExercise && partner ? volume(partner.entries, activeExercise, range) : 0

  return <main className={styles.page}>
    <header className={styles.header}><button onClick={onBack}><ArrowLeft size={17} /> {t('backToStats')}</button><div><UsersRound size={18} /><h1>{t('trainingPartner')}</h1></div></header>
    <section className={styles.partnerBar}><div className={styles.partnerList}>{activePartners.map((item) => <button key={item.id} className={partner?.id === item.id ? styles.selectedPartner : ''} onClick={() => { setSelectedId(item.id); setEditingName(false) }}>{item.photo ? <img src={item.photo} alt="" /> : <span>{item.name.slice(0, 1).toUpperCase()}</span>}<small>{item.name}</small></button>)}{activePartners.length < 5 && <button className={styles.addPartner} onClick={() => { setAdding(true); setNameInput('') }}><Plus size={18} /><small>{t('addPartner')}</small></button>}</div>{adding && <div className={styles.addPartnerForm}><input autoFocus value={nameInput} placeholder={t('partnerName')} onChange={(e) => setNameInput(e.target.value)} /><button onClick={addPartner}>{t('addPartner')}</button><button onClick={() => setAdding(false)}>{t('cancel')}</button></div>}</section>
    <button className={styles.archiveToggle} onClick={() => setShowArchive((open) => !open)}><Archive size={15} /> {t('partnerArchive')} ({archivedPartners.length}) <ChevronDown size={14} /></button>
    {showArchive && <section className={styles.archive}>{archivedPartners.length === 0 ? <p>{t('archiveEmpty')}</p> : archivedPartners.map((item) => <article key={item.id}><span>{item.name}</span><div><button disabled={activePartners.length >= 5} onClick={() => restorePartner(item)}><ArchiveRestore size={14} /> {t('restorePartner')}</button><button className={styles.delete} onClick={() => setDeletePartnerTarget(item)}><Trash2 size={14} /></button></div></article>)}</section>}
    {!partner ? <p className={styles.empty}>{t('partnerEmpty')}</p> : <>
      <section className={styles.profile}><label className={styles.avatar}>{partner.photo ? <img src={partner.photo} alt={partner.name} /> : <ImagePlus size={19} />}<input type="file" accept="image/*" onChange={(e) => void addPhoto(e.target.files?.[0])} /></label><div><span>{t('partnerName')}</span>{editingName ? <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} /> : <b>{partner.name}</b>}</div><button onClick={() => editingName ? saveName() : (setNameInput(partner.name), setEditingName(true))}>{editingName ? <Check size={15} /> : <Pencil size={15} />}</button><button className={styles.archiveButton} onClick={archivePartner}><Archive size={15} /> {t('archivePartner')}</button></section>
      <section className={styles.compare}><div className={styles.compareHead}><Target size={16} /><h2>{t('partnerComparison')}</h2></div><div className={styles.filters}>{(['30d', '6m', '1y', 'all'] as Range[]).map((item) => <button key={item} className={range === item ? styles.active : ''} onClick={() => setRange(item)}>{t(`range_${item}` as Parameters<typeof t>[0])}</button>)}</div>{categories.length === 0 ? <p>{t('partnerComparisonEmpty')}</p> : <><div className={styles.categories}>{categories.map((name) => <button key={name} className={activeExercise === name ? styles.selected : ''} onClick={() => setSelectedExercise(name.toLocaleLowerCase())}>{name}</button>)}</div><div className={styles.score}><div className={myVolume >= partnerVolume ? styles.winner : ''}><span>{t('me')}</span><b>{myVolume}</b></div><div className={partnerVolume > myVolume ? styles.winner : ''}><span>{partner.name}</span><b>{partnerVolume}</b></div></div></>}</section>
      <section className={styles.entries}><div className={styles.entryHead}><h2>{t('partnerResults')}</h2><button onClick={() => setFormOpen((open) => !open)}><Plus size={15} /> {t('addTraining')}</button></div>{formOpen && <div className={styles.form}><input type="date" value={draft.date} onChange={(e) => setDraft((item) => ({ ...item, date: e.target.value }))} /><input list="partner-category-suggestions" value={draft.name} placeholder={t('categoryName')} onChange={(e) => setDraft((item) => ({ ...item, name: e.target.value }))} /><datalist id="partner-category-suggestions">{categories.map((category) => <option key={category} value={category} />)}</datalist><div className={styles.sets}>{draft.sets.map((value, index) => <div key={index}><span>{t('setNumber')} {index + 1}</span><input type="number" min="0" inputMode="numeric" value={value || ''} onChange={(e) => updateSet(index, e.target.value)} />{draft.sets.length > 1 && <button aria-label={t('removeSet')} onClick={() => removeSet(index)}><Trash2 size={13} /></button>}</div>)}<button className={styles.addSet} onClick={addSet}><Plus size={13} /> {t('addSet')}</button></div><b>{t('trainingTotal')}: {draft.sets.reduce((total, value) => total + value, 0)}</b><button className={styles.save} disabled={!draft.name.trim()} onClick={saveEntry}>{t('saveTraining')}</button></div>}{partner.entries.length === 0 ? <p className={styles.empty}>{t('partnerEntriesEmpty')}</p> : <div className={styles.list}>{partner.entries.map((entry) => <article key={entry.id}><div><b>{entry.date}</b>{entry.metrics?.map((metric) => <span key={metric.id}>{metric.name}: <strong>{metric.value}</strong>{metric.sets && metric.sets.length > 1 && <small> · {metric.sets.join(' + ')}</small>}</span>)}</div><button aria-label={t('deleteTraining')} onClick={() => setDeleteEntryTarget(entry)}><Trash2 size={15} /></button></article>)}</div>}</section>
    </>}
    <ConfirmModal open={Boolean(deleteEntryTarget)} message={t('confirmDeletePartnerTraining')} danger onConfirm={deleteEntry} onCancel={() => setDeleteEntryTarget(null)} />
    <ConfirmModal open={Boolean(deletePartnerTarget)} message={t('confirmDeletePartner')} danger onConfirm={deletePartner} onCancel={() => setDeletePartnerTarget(null)} />
  </main>
}
