import { useState, useEffect } from 'react'
import { User, Weight, CalendarDays } from 'lucide-react'
import Modal from '@/components/UI/Modal'
import { BtnPrimary, BtnGhost } from '@/components/UI/Buttons'
import { t, tBelt } from '@/services/i18n'
import type { Profile } from '@/types'
import styles from './ProfileModal.module.css'

interface Props {
  open: boolean
  profile: Profile
  onClose: () => void
  onSave: (p: Profile) => Promise<void>
}

const BELT_KEYS = ['white','yellow','orange','green','blue','brown','black1','black2','black3'] as const

export default function ProfileModal({ open, profile, onClose, onSave }: Props) {
  const [form, setForm] = useState({ name: '', belt: '', weight: '', dob: '', since: '' })

  useEffect(() => {
    if (!open) return
    setForm({
      name:   profile.name   ?? '',
      belt:   profile.belt   ?? '',
      weight: profile.weight ?? '',
      dob:    profile.dob    ?? '',
      since:  profile.since  ?? '',
    })
  }, [open, profile])

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    await onSave({ ...profile, ...form })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('athlete')}
      maxWidth={440}
      actions={
        <>
          <BtnPrimary onClick={handleSave}>✓ {t('save')}</BtnPrimary>
          <BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost>
        </>
      }
    >
      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.label}><User size={12} /> {t('athlete')}</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Прізвище Ім'я"
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('belt')}</label>
          <select value={form.belt} onChange={(e) => set('belt', e.target.value)}>
            <option value="">—</option>
            {BELT_KEYS.map((k) => <option key={k} value={k}>{tBelt(k)}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}><Weight size={12} /> {t('weightCat')}</label>
          <input
            value={form.weight}
            onChange={(e) => set('weight', e.target.value)}
            placeholder="-60 kg"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}><CalendarDays size={12} /> {t('born')}</label>
          <input
            value={form.dob}
            onChange={(e) => set('dob', e.target.value)}
            placeholder="2011"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('since')}</label>
          <input
            value={form.since}
            onChange={(e) => set('since', e.target.value)}
            placeholder="2019"
          />
        </div>
      </div>
    </Modal>
  )
}
