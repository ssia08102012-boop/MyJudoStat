import { useState, useEffect } from 'react'
import { CalendarDays, MapPin, Weight, Trophy, Hash, AlignLeft, Youtube, FileText, Check } from 'lucide-react'
import Modal from '@/components/UI/Modal'
import { BtnPrimary, BtnGhost } from '@/components/UI/Buttons'
import { t } from '@/services/i18n'
import type { Tournament, Fight } from '@/types'
import styles from './TournamentModal.module.css'

interface Props {
  open: boolean
  initial?: Tournament | null
  onClose: () => void
  onSave: (comp: Tournament) => void
}

function datePickerToDisplay(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso
}

function displayToDatePicker(disp: string): string {
  const m = disp.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''
}

function extractYear(s: string): number {
  const m = s.match(/(\d{4})/)
  return m ? parseInt(m[1]) : new Date().getFullYear()
}

function parseSortKey(date: string): string {
  const m = date.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  return '0000-00-00'
}


function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const DEFAULT_FORM = {
  name: '',
  datePicker: todayIso(),
  dateDisplay: datePickerToDisplay(todayIso()),
  location: '',
  ageCategory: 'U13',
  weightCategory: '',
  place: '1' as string,
  fightsCount: '',
  notes: '',
  yt: '',
  pdf: '',
}

type FormState = typeof DEFAULT_FORM

export default function TournamentModal({ open, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [fightSeq, setFightSeq] = useState<Array<'w' | 'l'>>([])

  function resizeFightSeq(n: number, prev: Array<'w' | 'l'>): Array<'w' | 'l'> {
    if (n <= prev.length) return prev.slice(0, n)
    return [...prev, ...Array.from({ length: n - prev.length }, () => 'l' as const)]
  }

  useEffect(() => {
    if (!open) return
    if (initial) {
      const dp = initial._sortKey && initial._sortKey !== '0000-00-00'
        ? initial._sortKey
        : displayToDatePicker(initial.date)
      setForm({
        name: initial.name,
        datePicker: dp || todayIso(),
        dateDisplay: initial.date,
        location: initial.location,
        ageCategory: initial.ageCategory,
        weightCategory: initial.weightCategory,
        place: initial.place != null ? String(initial.place) : '',
        fightsCount: String(initial.fights.length),
        notes: initial.notes,
        yt: initial.yt,
        pdf: initial.pdf,
      })
      setFightSeq(initial.fights.map((f) => f.r))
    } else {
      const today = todayIso()
      setForm({ ...DEFAULT_FORM, datePicker: today, dateDisplay: datePickerToDisplay(today) })
      setFightSeq([])
    }
    setErrors({})
  }, [open, initial])

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function onFightsCountChange(val: string) {
    set('fightsCount', val)
    const n = Math.max(0, parseInt(val) || 0)
    setFightSeq((prev) => resizeFightSeq(n, prev))
  }

  function toggleFight(i: number) {
    setFightSeq((prev) => prev.map((r, idx) => idx === i ? (r === 'w' ? 'l' : 'w') : r))
  }

  function onPickerChange(iso: string) {
    setForm((f) => ({ ...f, datePicker: iso, dateDisplay: datePickerToDisplay(iso) }))
  }

  function onDisplayChange(disp: string) {
    const picker = displayToDatePicker(disp)
    setForm((f) => ({ ...f, dateDisplay: disp, datePicker: picker || f.datePicker }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) e.name = t('enterName')
    if (!form.fightsCount || isNaN(parseInt(form.fightsCount))) e.fightsCount = t('enterFights')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const count = Math.max(1, parseInt(form.fightsCount) || 1)
    const fights: Fight[] = Array.from({ length: count }, (_, i) => ({
      r: fightSeq[i] ?? 'l',
    }))
    const year = extractYear(form.dateDisplay)
    const comp: Tournament = {
      id: initial?.id ?? `c${Date.now()}`,
      name: form.name.trim(),
      date: form.dateDisplay.trim(),
      location: form.location.trim(),
      year,
      ageCategory: form.ageCategory.trim(),
      weightCategory: form.weightCategory.trim(),
      place: form.place ? parseInt(form.place) || null : null,
      fights,
      notes: form.notes.trim(),
      yt: form.yt.trim(),
      pdf: form.pdf.trim(),
      _sortKey: parseSortKey(form.dateDisplay),
    }
    onSave(comp)
    onClose()
  }

  const isEdit = !!initial
  const title = isEdit ? t('editTournament') : t('newTournament')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={600}
      actions={
        <>
          <BtnPrimary onClick={handleSave}><Check size={14} /> {t('save')}</BtnPrimary>
          <BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost>
        </>
      }
    >
      <div className={styles.grid}>
        {/* Name */}
        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.label}>{t('tournamentName')}</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t('enterName')}
            className={errors.name ? styles.errInput : ''}
          />
          {errors.name && <span className={styles.err}>{errors.name}</span>}
        </div>

        {/* Date */}
        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.label}>
            <CalendarDays size={12} /> {t('date')}
          </label>
          <div className={styles.dateRow}>
            <input
              type="date"
              value={form.datePicker}
              onChange={(e) => onPickerChange(e.target.value)}
              className={styles.datePicker}
            />
            <input
              value={form.dateDisplay}
              onChange={(e) => onDisplayChange(e.target.value)}
              placeholder="15.03.2026"
              className={styles.dateText}
            />
          </div>
          <small className={styles.hint}>{t('dateHint')}</small>
        </div>

        {/* Location */}
        <div className={styles.field}>
          <label className={styles.label}><MapPin size={12} /> {t('city')}</label>
          <input value={form.location} onChange={(e) => set('location', e.target.value)} />
        </div>

        {/* Age cat */}
        <div className={styles.field}>
          <label className={styles.label}>{t('ageCategory')}</label>
          <input value={form.ageCategory} onChange={(e) => set('ageCategory', e.target.value)} />
        </div>

        {/* Weight cat */}
        <div className={styles.field}>
          <label className={styles.label}><Weight size={12} /> {t('weightCategory')}</label>
          <input value={form.weightCategory} onChange={(e) => set('weightCategory', e.target.value)} placeholder="60 kg" />
        </div>

        {/* Place */}
        <div className={styles.field}>
          <label className={styles.label}><Trophy size={12} /> {t('place')}</label>
          <select value={form.place} onChange={(e) => set('place', e.target.value)}>
            <option value="1">1 — {t('gold')}</option>
            <option value="2">2 — {t('silver')}</option>
            <option value="3">3 — {t('bronze')}</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="">—</option>
          </select>
        </div>

        {/* Fights count */}
        <div className={styles.field}>
          <label className={styles.label}><Hash size={12} /> {t('fightsCount')}</label>
          <input
            type="number"
            min="1"
            max="20"
            value={form.fightsCount}
            onChange={(e) => onFightsCountChange(e.target.value)}
            className={errors.fightsCount ? styles.errInput : ''}
          />
          {errors.fightsCount && <span className={styles.err}>{errors.fightsCount}</span>}
        </div>

        {/* Fight results — visual W/L buttons */}
        {fightSeq.length > 0 && (
          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label}>{t('fightsSeq')}</label>
            <div className={styles.seqWrap}>
              {fightSeq.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  className={`${styles.fightBtn} ${r === 'w' ? styles.fightW : styles.fightL}`}
                  onClick={() => toggleFight(i)}
                  aria-label={`Fight ${i + 1}`}
                >
                  <span className={styles.fightNum}>{i + 1}</span>
                  <span>{r === 'w' ? 'W' : 'L'}</span>
                </button>
              ))}
            </div>
            <small className={styles.hint}>{t('tapToToggle')}</small>
          </div>
        )}

        {/* Notes */}
        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.label}><AlignLeft size={12} /> {t('notes')}</label>
          <input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {/* YouTube */}
        <div className={styles.field}>
          <label className={styles.label}><Youtube size={12} /> YouTube</label>
          <input value={form.yt} onChange={(e) => set('yt', e.target.value)} placeholder="https://..." />
        </div>

        {/* PDF */}
        <div className={styles.field}>
          <label className={styles.label}><FileText size={12} /> PDF</label>
          <input value={form.pdf} onChange={(e) => set('pdf', e.target.value)} placeholder="https://..." />
        </div>
      </div>
    </Modal>
  )
}
