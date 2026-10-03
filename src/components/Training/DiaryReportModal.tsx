import { useEffect, useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import Modal from '@/components/UI/Modal'
import { BtnGhost, BtnPrimary } from '@/components/UI/Buttons'
import { t } from '@/services/i18n'
import type { Profile, TrainingEntry } from '@/types'
import styles from './DiaryReportModal.module.css'

interface Props {
  open: boolean
  entries: TrainingEntry[]
  profile: Profile
  onClose: () => void
  showToast: (message: string) => void
}

function today(): string { return new Date().toISOString().slice(0, 10) }

export default function DiaryReportModal({ open, entries, profile, onClose, showToast }: Props) {
  const [from, setFrom] = useState(() => `${new Date().getFullYear()}-01-01`)
  const [to, setTo] = useState(today)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const included = useMemo(() => entries.filter((entry) => entry.date >= from && entry.date <= to), [entries, from, to])

  useEffect(() => { if (open) setError('') }, [open])

  async function generate() {
    if (from > to) return setError(t('reportInvalidPeriod'))
    if (included.length === 0) return setError(t('reportNoEntries'))
    setBusy(true)
    setError('')
    try {
      const { createDiaryReport } = await import('@/services/diaryReport')
      const file = await createDiaryReport(included, profile, from, to)
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: t('reportDiaryTitle'), files: [file] })
      } else {
        const url = URL.createObjectURL(file)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = file.name
        anchor.click()
        URL.revokeObjectURL(url)
        showToast(t('reportShareUnsupported'))
      }
      onClose()
    } catch (reason) {
      if ((reason as DOMException).name !== 'AbortError') setError(t('importErr'))
    } finally {
      setBusy(false)
    }
  }

  async function generateExcel() {
    if (from > to) return setError(t('reportInvalidPeriod'))
    if (included.length === 0) return setError(t('reportNoEntries'))
    setBusy(true)
    setError('')
    try {
      const { createDiaryExcel } = await import('@/services/excelReport')
      const file = await createDiaryExcel(included, profile, from, to)
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: t('reportExcelTitle'), files: [file] })
      } else {
        const url = URL.createObjectURL(file)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = file.name
        anchor.click()
        URL.revokeObjectURL(url)
        showToast(t('reportShareUnsupported'))
      }
      onClose()
    } catch (reason) {
      if ((reason as DOMException).name !== 'AbortError') setError(t('importErr'))
    } finally {
      setBusy(false)
    }
  }

  return <Modal open={open} onClose={onClose} title={t('exportDiaryTitle')} maxWidth={430} actions={<><BtnPrimary onClick={generate} disabled={busy}><FileDown size={15} /> PDF</BtnPrimary><BtnGhost onClick={generateExcel} disabled={busy}><FileSpreadsheet size={15} /> EXCEL</BtnGhost><BtnGhost onClick={onClose} disabled={busy}>{t('cancel')}</BtnGhost></>}>
    <div className={styles.form}>
      <p>{t('diaryIntro')}</p>
      <div className={styles.dates}>
        <label>{t('reportFrom')}<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>{t('reportTo')}<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      </div>
      <div className={styles.count}>{included.length} {t('reportEntries')}</div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  </Modal>
}
