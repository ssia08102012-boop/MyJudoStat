import { useState, useRef } from 'react'
import { Camera, ChevronDown, User } from 'lucide-react'
import { t } from '@/services/i18n'
import { savePhoto } from '@/services/storage'
import type { Profile, Coach } from '@/types'
import styles from './Coaches.module.css'

interface Props {
  profile: Profile
  onUpdateProfile: (p: Profile) => Promise<void>
}

type EditTarget = { idx: number; field: 'name' | 'role' }

function getCoach(profile: Profile, i: number): Coach {
  const key = `coach${i}` as 'coach0' | 'coach1' | 'coach2'
  return profile[key] ?? {}
}

export default function Coaches({ profile, onUpdateProfile }: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [editVal, setEditVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function patchCoach(i: number, patch: Partial<Coach>) {
    const key = `coach${i}` as 'coach0' | 'coach1' | 'coach2'
    await onUpdateProfile({ ...profile, [key]: { ...getCoach(profile, i), ...patch } })
  }

  async function handlePhoto(i: number, file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const photo = e.target?.result as string
      await savePhoto(`coach_photo_${i}`, photo)
      await patchCoach(i, { photo })
    }
    reader.readAsDataURL(file)
  }

  function startEdit(idx: number, field: 'name' | 'role') {
    const val = getCoach(profile, idx)[field] ?? ''
    setEditVal(val)
    setEditTarget({ idx, field })
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  async function commitEdit() {
    if (!editTarget) return
    await patchCoach(editTarget.idx, { [editTarget.field]: editVal.trim() })
    setEditTarget(null)
  }

  function CoachCard({ i, isHead }: { i: number; isHead: boolean }) {
    const coach = getCoach(profile, i)
    const isExpanded = expanded[i] ?? false
    const isEditing = (field: 'name' | 'role') =>
      editTarget?.idx === i && editTarget?.field === field

    return (
      <div className={`${styles.card} ${isHead ? styles.head : ''}`}>
        {/* Photo thumbnail */}
        <div className={`${styles.photoWrap} ${isExpanded ? styles.expanded : ''}`}>
          {coach.photo ? (
            <img className={styles.photo} src={coach.photo} alt={coach.name ?? 'coach'} />
          ) : (
            <div className={styles.placeholder}>
              <User size={isHead ? 22 : 18} strokeWidth={1} color="var(--orange)" />
            </div>
          )}
          <label className={styles.cameraBtn} onClick={(e) => e.stopPropagation()}>
            <Camera size={11} />
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) => void handlePhoto(i, e.target.files?.[0])}
            />
          </label>
          <button
            className={styles.expandBtn}
            onClick={() => setExpanded((ex) => ({ ...ex, [i]: !ex[i] }))}
          >
            <ChevronDown size={11} className={isExpanded ? styles.chevronUp : ''} />
          </button>
        </div>

        {/* Text info */}
        <div className={styles.info}>
          {isHead && <span className={styles.headBadge}>{t('headCoach')}</span>}

          {isEditing('name') ? (
            <input
              ref={inputRef}
              className={styles.inlineInput}
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onBlur={() => void commitEdit()}
              onKeyDown={(e) => e.key === 'Enter' && void commitEdit()}
            />
          ) : (
            <div
              className={`${styles.name} ${!coach.name ? styles.placeholderText : ''}`}
              onClick={() => startEdit(i, 'name')}
            >
              {coach.name || t('coachName')}
            </div>
          )}

          {isEditing('role') ? (
            <input
              ref={inputRef}
              className={styles.inlineInput}
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onBlur={() => void commitEdit()}
              onKeyDown={(e) => e.key === 'Enter' && void commitEdit()}
            />
          ) : (
            <div
              className={`${styles.role} ${!coach.role ? styles.placeholderText : ''}`}
              onClick={() => startEdit(i, 'role')}
            >
              {coach.role || t('trainer')}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>
        <span>{t('coaches')}</span>
        <div className={styles.labelLine} />
      </div>
      <div className={styles.strip}>
        <CoachCard i={0} isHead />
        <CoachCard i={1} isHead={false} />
        <CoachCard i={2} isHead={false} />
      </div>
    </div>
  )
}
