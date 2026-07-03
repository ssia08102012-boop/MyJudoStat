import { useState, useEffect } from 'react'
import { User, Shield, Clock, StickyNote, Check, X } from 'lucide-react'
import Modal from '@/components/UI/Modal'
import { BtnPrimary, BtnGhost } from '@/components/UI/Buttons'
import { t } from '@/services/i18n'
import { getFight, saveFight } from '@/services/storage'
import type { Tournament, FightDetail } from '@/types'
import styles from './FightModal.module.css'

interface Props {
  open: boolean
  comp: Tournament | null
  fi: number
  onClose: () => void
  onSaved: () => void
}

const TECHNIQUES = [
  { group: 'Nage-waza',  items: ['Seoi Nage','Ippon Seoi Nage','Morote Seoi Nage','O Goshi','Koshi Guruma','Uchi Mata','Harai Goshi','Hane Goshi','O Soto Gari','Ko Soto Gari','O Uchi Gari','Ko Uchi Gari','Tai Otoshi','De Ashi Barai','Tomoe Nage','Sumi Gaeshi','Ura Nage','Tani Otoshi'] },
  { group: 'Ne-waza',    items: ['Hon Kesa Gatame','Kuzure Kesa Gatame','Yoko Shiho Gatame','Tate Shiho Gatame','Ude Garami','Juji Gatame','Hadaka Jime'] },
  { group: 'Рішення',    items: ['Хантей','Hansoku-make','Відмова суперника'] },
]

const SCORE_TYPES = [
  'Ippon','Waza-ari awasete Ippon','Waza-ari',
  'Хантей — перемога','Hansoku-make суперника',
  'Поразка Ippon','Поразка Waza-ari','Поразка Хантей',
]

const STAGES = ['pool','final','bronze'] as const

const EMPTY: FightDetail = {
  f_opp_name: '', f_opp_club: '', f_opp_country: '', f_opp_age: '', f_opp_weight: '',
  f_score_me: '', f_score_opp: '', f_score_type: '', f_stage: '',
  f_tech: '', f_tech_custom: '', f_duration: '', f_notes: '',
}

export default function FightModal({ open, comp, fi, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FightDetail>(EMPTY)
  const [showCustomTech, setShowCustomTech] = useState(false)

  useEffect(() => {
    if (!open || !comp) return
    const data = getFight(comp.id, fi)
    setForm({ ...EMPTY, ...data })
    setShowCustomTech(data.f_tech === 'custom')
  }, [open, comp, fi])

  function set(field: keyof FightDetail, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (field === 'f_tech') {
      setShowCustomTech(value === 'custom')
    }
  }

  async function handleSave() {
    if (!comp) return
    const data = { ...form }
    if (data.f_tech === 'custom') data.f_tech = data.f_tech_custom || ''
    await saveFight(comp.id, fi, data)
    onSaved()
    onClose()
  }

  async function handleClear() {
    if (!comp) return
    await saveFight(comp.id, fi, {})
    setForm(EMPTY)
    onSaved()
    onClose()
  }

  if (!comp) return null
  const fight = comp.fights[fi]
  const isWin = fight?.r === 'w'
  const fightNum = `${t('fightOf')} ${fi + 1} ${t('of')} ${comp.fights.length}`
  const badge = isWin ? t('victory') : t('defeat')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${comp.name} · ${fightNum}`}
      maxWidth={580}
      actions={
        <>
          <BtnPrimary onClick={handleSave}><Check size={14} /> {t('save')}</BtnPrimary>
          <BtnGhost onClick={handleClear} danger style={{ maxWidth: 44, padding: '10px' }}><X size={14} /></BtnGhost>
        </>
      }
    >
      <div className={styles.resultBadge} data-win={isWin}>
        {badge}
      </div>

      {/* Opponent */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}><User size={13} /> {t('opponent')}</div>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.full}`}>
            <label>{t('fullName')}</label>
            <input value={form.f_opp_name ?? ''} onChange={(e) => set('f_opp_name', e.target.value)} placeholder="Прізвище Ім'я" />
          </div>
          <div className={styles.field}>
            <label>{t('club')}</label>
            <input value={form.f_opp_club ?? ''} onChange={(e) => set('f_opp_club', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>{t('country')}</label>
            <input value={form.f_opp_country ?? ''} onChange={(e) => set('f_opp_country', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>{t('ageCategory')}</label>
            <input value={form.f_opp_age ?? ''} onChange={(e) => set('f_opp_age', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>{t('oppWeight')}</label>
            <input value={form.f_opp_weight ?? ''} onChange={(e) => set('f_opp_weight', e.target.value)} placeholder="60 kg" />
          </div>
        </div>
      </section>

      {/* Score */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}><Shield size={13} /> {t('score')}</div>
        <div className={styles.scoreRow}>
          <div className={styles.scoreBox}>
            <label>{t('myScore')}</label>
            <input className={styles.scoreInput} value={form.f_score_me ?? ''} onChange={(e) => set('f_score_me', e.target.value)} placeholder="10" />
          </div>
          <span className={styles.scoreDivider}>:</span>
          <div className={styles.scoreBox}>
            <label>{t('oppScore')}</label>
            <input className={styles.scoreInput} value={form.f_score_opp ?? ''} onChange={(e) => set('f_score_opp', e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className={styles.grid} style={{ marginTop: 8 }}>
          <div className={styles.field}>
            <label><Clock size={11} /> {t('duration')}</label>
            <input value={form.f_duration ?? ''} onChange={(e) => set('f_duration', e.target.value)} placeholder="1:45" />
          </div>
          <div className={styles.field}>
            <label>{t('stage')}</label>
            <select value={form.f_stage ?? ''} onChange={(e) => set('f_stage', e.target.value)}>
              <option value="">—</option>
              {STAGES.map((s) => <option key={s} value={s}>{t(s === 'pool' ? 'pool' : s === 'final' ? 'final' : 'bronzeFight')}</option>)}
            </select>
          </div>
          <div className={`${styles.field} ${styles.full}`}>
            <label>{t('score')}</label>
            <select value={form.f_score_type ?? ''} onChange={(e) => set('f_score_type', e.target.value)}>
              <option value="">—</option>
              {SCORE_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Technique */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t('technique')}</div>
        <select value={form.f_tech ?? ''} onChange={(e) => set('f_tech', e.target.value)}>
          <option value="">—</option>
          {TECHNIQUES.map(({ group, items }) => (
            <optgroup key={group} label={group}>
              {items.map((it) => <option key={it}>{it}</option>)}
            </optgroup>
          ))}
          <option value="custom">{t('customTech')}</option>
        </select>
        {showCustomTech && (
          <input
            style={{ marginTop: 8 }}
            value={form.f_tech_custom ?? ''}
            onChange={(e) => set('f_tech_custom', e.target.value)}
            placeholder={t('customTech')}
          />
        )}
      </section>

      {/* Notes */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}><StickyNote size={13} /> {t('notes')}</div>
        <textarea
          value={form.f_notes ?? ''}
          onChange={(e) => set('f_notes', e.target.value)}
          placeholder="Що вдалося? Помилки? Що відпрацювати..."
          rows={3}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </section>
    </Modal>
  )
}
