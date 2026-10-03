import { useEffect, useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import Modal from '@/components/UI/Modal'
import { BtnGhost, BtnPrimary } from '@/components/UI/Buttons'
import { t } from '@/services/i18n'
import { prepareFileTarget, shareOrDownloadFile } from '@/services/fileShare'
import { withExportTimeout } from '@/services/exportTask'
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

  useEffect(() => {
    if (!open) return
    setError('')
    // Preload both generators before the final export action on iPhone.
    void import('@/services/diaryReport')
    void import('@/services/excelReport')
  }, [open])

  async function generate() {
    if (from > to) return setError(t('reportInvalidPeriod'))
    if (included.length === 0) return setError(t('reportNoEntries'))
    const target = prepareFileTarget()
    setBusy(true)
    setError('')
    try {
      const { createDiaryReport } = await import('@/services/diaryReport')
      const file = await withExportTimeout(createDiaryReport(included, profile, from, to))
      if (await shareOrDownloadFile(file, t('reportDiaryTitle'), target) === 'downloaded') showToast(t('reportShareUnsupported'))
      onClose()
    } catch (reason) {
      if ((reason as DOMException).name !== 'AbortError') setError(t('reportGenerationFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function generateExcel() {
    if (from > to) return setError(t('reportInvalidPeriod'))
    if (included.length === 0) return setError(t('reportNoEntries'))
    const target = prepareFileTarget()
    setBusy(true)
    setError('')
    try {
      const { createDiaryExcel } = await import('@/services/excelReport')
      const file = await withExportTimeout(createDiaryExcel(included, profile, from, to))
      if (await shareOrDownloadFile(file, t('reportExcelTitle'), target) === 'downloaded') showToast(t('reportShareUnsupported'))
      onClose()
    } catch (reason) {
      if ((reason as DOMException).name !== 'AbortError') setError(t('reportGenerationFailed'))
    } finally {
      setBusy(false)
    }
  }

  return <Modal open={open} onClose={onClose} title={t('exportDiaryTitle')} maxWidth={430} actions={<><BtnPrimary onClick={generate} disabled={busy}><FileDown size={15} /> {busy ? t('reportCreating') : 'PDF'}</BtnPrimary><BtnGhost className={styles.excelAction} onClick={generateExcel} disabled={busy}><FileSpreadsheet size={15} /> {busy ? t('reportCreating') : 'EXCEL'}</BtnGhost><BtnGhost onClick={onClose} disabled={busy}>{t('cancel')}</BtnGhost></>}>
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
