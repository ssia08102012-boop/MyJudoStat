import { Camera, User } from 'lucide-react'
import { t } from '@/services/i18n'
import { calcStats } from '@/services/storage'
import type { Profile, Tournament, Lang } from '@/types'
import { BELT_COLORS } from './beltColors'
import styles from './Hero.module.css'

interface Props {
  profile: Profile
  comps: Tournament[]
  onUpdateProfile: (p: Profile) => Promise<void>
  lang: Lang
}

export default function Hero({ profile, comps, onUpdateProfile }: Props) {
  const s = calcStats(comps)
  const winRate = s.fights > 0 ? Math.round((s.wins / s.fights) * 100) : 0
  const belt = BELT_COLORS.find((b) =>
    b.keys.some((k) => (profile.belt ?? '').toLowerCase().includes(k)),
  )

  async function handlePhotoClick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        await onUpdateProfile({ ...profile, photo: dataUrl })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return (
    <header className={styles.header}>
      <div className={styles.heroKanji}>柔道</div>
      <div className={styles.inner}>

        {/* Photo column */}
        <div className={styles.photoCol} onClick={handlePhotoClick} role="button" tabIndex={0}>
          {profile.photo ? (
            <img className={styles.photo} src={profile.photo} alt="athlete" />
          ) : (
            <div className={styles.photoPlaceholder}>
              <User size={48} strokeWidth={1} color="var(--orange)" />
              <span className={styles.addPhotoLabel}>{t('addPhoto')}</span>
            </div>
          )}
          <div className={styles.photoOverlay}>
            <Camera size={20} color="#fff" />
          </div>
          <div className={styles.photoFade} />
        </div>

        {/* Data column */}
        <div className={styles.dataCol}>
          <div className={styles.name}>
            {profile.name || 'ІМ\'Я СПОРТСМЕНА'}
          </div>

          {/* Belt visual */}
          <div className={styles.beltWrap} style={belt ? { boxShadow: `0 0 28px 6px ${belt.glow}99` } : {}}>
            <div className={styles.beltStrip} style={belt ? { background: belt.color } : {}} />
            <div
              className={styles.beltKnot}
              style={belt ? { background: belt.color, boxShadow: `0 0 16px 4px ${belt.glow}` } : {}}
            />
            <div className={styles.beltStrip} style={belt ? { background: belt.color } : {}} />
            <span className={styles.beltName} style={belt ? { color: belt.glow } : {}}>
              {profile.belt || '—'} <small>{t('belt')}</small>
            </span>
          </div>

          {/* Attributes chips */}
          <div className={styles.chips}>
            {[
              { label: t('weightCat'), val: profile.weight },
              { label: t('born'),      val: profile.dob },
              { label: t('since'),     val: profile.since },
            ].map(({ label, val }) => (
              <div key={label} className={styles.chip}>
                <span className={styles.chipLabel}>{label}</span>
                <span className={styles.chipVal}>{val || '—'}</span>
              </div>
            ))}
          </div>

          {/* Live stats */}
          <div className={styles.liveStats}>
            {[
              { val: s.tournaments, lbl: t('tournaments') },
              { val: s.fights,      lbl: t('fights') },
              { val: `${winRate}%`, lbl: t('winRate') },
              { val: s.gold,        lbl: t('gold') },
            ].map(({ val, lbl }) => (
              <div key={lbl} className={styles.statItem}>
                <div className={styles.statVal}>{val}</div>
                <div className={styles.statLbl}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
