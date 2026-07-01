import { useState } from 'react'
import { ChevronDown, Pencil, Trash2, Youtube, FileText, MapPin, Share2 } from 'lucide-react'
import { t } from '@/services/i18n'
import { getFight } from '@/services/storage'
import type { Tournament } from '@/types'
import styles from './TournamentCard.module.css'

interface Props {
  comp: Tournament
  onEdit: (c: Tournament) => void
  onDelete: (id: string) => Promise<void>
  onOpenFight: (comp: Tournament, fi: number) => void
  showToast: (msg: string) => void
}

function medalClass(place: number | null) {
  if (place === 1) return styles.gold
  if (place === 2) return styles.silver
  if (place === 3) return styles.bronze
  return ''
}

function medalIcon(place: number | null) {
  if (place === 1) return '🥇'
  if (place === 2) return '🥈'
  if (place === 3) return '🥉'
  return ''
}

function placeLabel(place: number | null) {
  if (!place) return '—'
  return `${place} м.`
}

async function shareResult(comp: Tournament) {
  const wins = comp.fights.filter((f) => f.r === 'w').length
  const losses = comp.fights.filter((f) => f.r === 'l').length
  const icon = medalIcon(comp.place)
  const text = [
    `${icon} ${comp.name}`,
    comp.date,
    comp.location ? `📍 ${comp.location}` : '',
    `${wins}W / ${losses}L${comp.place ? ` · ${placeLabel(comp.place)}` : ''}`,
    '\n#MyJudoStat #Judo',
  ].filter(Boolean).join('\n')

  try {
    if (navigator.share) await navigator.share({ title: 'My Judo Stat', text })
    else await navigator.clipboard.writeText(text)
  } catch { /* user cancelled or not supported */ }
}

export default function TournamentCard({ comp, onEdit, onDelete, onOpenFight, showToast }: Props) {
  const [open, setOpen] = useState(false)
  const wins = comp.fights.filter((f) => f.r === 'w').length
  const losses = comp.fights.filter((f) => f.r === 'l').length

  async function handleDelete() {
    if (!confirm(t('confirmDelete'))) return
    await onDelete(comp.id)
    showToast(t('deleted'))
  }

  return (
    <div className={`${styles.card} ${medalClass(comp.place)}`}>
      {/* Header */}
      <div className={styles.header} onClick={() => setOpen((o) => !o)}>
        <div className={styles.left}>
          <div className={styles.date}>{comp.date}</div>
          <div className={styles.name}>{comp.name}</div>
          {comp.location && (
            <div className={styles.location}>
              <MapPin size={11} strokeWidth={2} />
              {comp.location}
            </div>
          )}
          <div className={styles.tags}>
            {comp.ageCategory  && <span className={styles.tagAge}>{comp.ageCategory}</span>}
            {comp.weightCategory && <span className={styles.tagWt}>{comp.weightCategory}</span>}
            {wins   > 0 && <span className={styles.tagWin}>✓ {wins}</span>}
            {losses > 0 && <span className={styles.tagLoss}>✗ {losses}</span>}
          </div>
        </div>

        <div className={styles.right}>
          <div className={`${styles.medal} ${medalClass(comp.place)}`}>
            <span className={styles.medalIcon}>{medalIcon(comp.place)}</span>
            <div className={styles.medalTxt}>{placeLabel(comp.place)}</div>
          </div>
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <button className={styles.iconBtn} onClick={() => onEdit(comp)} title="Edit">
              <Pencil size={14} strokeWidth={2} />
            </button>
            <button className={styles.iconBtn} onClick={() => void shareResult(comp)} title="Share">
              <Share2 size={14} strokeWidth={2} />
            </button>
          </div>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          />
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className={styles.body}>
          <div className={styles.fightsLabel}>{t('clickForDetails')}</div>
          <div className={styles.fights}>
            {comp.fights.map((f, fi) => {
              const detail = getFight(comp.id, fi)
              const hasData = !!(detail.f_opp_name || detail.f_tech || detail.f_notes || detail.f_score_me)
              return (
                <button
                  key={fi}
                  className={`${styles.bubble} ${f.r === 'w' ? styles.bubbleW : styles.bubbleL} ${hasData ? styles.bubbleHasData : ''}`}
                  onClick={() => onOpenFight(comp, fi)}
                  title={`${t('fightOf')} ${fi + 1}`}
                >
                  <span className={styles.bubbleNum}>{fi + 1}</span>
                  <span className={styles.bubbleRes}>{f.r === 'w' ? '✓' : '✗'}</span>
                </button>
              )
            })}
          </div>

          {comp.notes && <div className={styles.notes}>{comp.notes}</div>}

          {(comp.yt || comp.pdf) && (
            <div className={styles.links}>
              {comp.yt && (
                <a className={styles.ytLink} href={comp.yt} target="_blank" rel="noreferrer">
                  <Youtube size={14} strokeWidth={2} /> YouTube
                </a>
              )}
              {comp.pdf && (
                <a className={styles.pdfLink} href={comp.pdf} target="_blank" rel="noreferrer">
                  <FileText size={14} strokeWidth={2} /> PDF
                </a>
              )}
            </div>
          )}

          <button className={styles.deleteBtn} onClick={handleDelete}>
            <Trash2 size={14} strokeWidth={2} /> {t('deleteBtn')}
          </button>
        </div>
      )}
    </div>
  )
}
