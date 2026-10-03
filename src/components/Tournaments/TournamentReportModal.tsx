import { useEffect, useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import Modal from '@/components/UI/Modal'
import { BtnGhost, BtnPrimary } from '@/components/UI/Buttons'
import { t } from '@/services/i18n'
import { shareOrDownloadFile } from '@/services/fileShare'
import { withExportTimeout } from '@/services/exportTask'
import type { Profile, Tournament } from '@/types'
import styles from './TournamentReportModal.module.css'

interface Props {
  open: boolean
  comps: Tournament[]
  profile: Profile
  onClose: () => void
  showToast: (message: string) => void
}

export default function TournamentReportModal({ open, comps, profile, onClose, showToast }: Props) {
  const years = useMemo(() => [...new Set(comps.map((comp) => comp.year))].sort((a, b) => b - a), [comps])
  const [year, setYear] = useState<number | 'all'>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const included = useMemo(() => year === 'all' ? comps : comps.filter((comp) => comp.year === year), [comps, year])

  useEffect(() => { if (open) setError('') }, [open])

  async function generate() {
    if (included.length === 0) return setError(t('reportNoTournaments'))
    setBusy(true)
    setError('')
    try {
      const { createTournamentReport } = await import('@/services/tournamentReport')
      const file = await withExportTimeout(createTournamentReport(included, profile, year))
      if (await shareOrDownloadFile(file, t('reportTournamentsTitle')) === 'downloaded') showToast(t('reportShareUnsupported'))
      onClose()
    } catch (reason) {
      if ((reason as DOMException).name !== 'AbortError') setError(t('reportGenerationFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function generateExcel() {
    if (included.length === 0) return setError(t('reportNoTournaments'))
    setBusy(true)
    setError('')
    try {
      const { createTournamentExcel } = await import('@/services/excelReport')
      const file = await withExportTimeout(createTournamentExcel(included, profile, year))
      if (await shareOrDownloadFile(file, t('reportExcelTitle')) === 'downloaded') showToast(t('reportShareUnsupported'))
      onClose()
    } catch (reason) {
      if ((reason as DOMException).name !== 'AbortError') setError(t('reportGenerationFailed'))
    } finally {
      setBusy(false)
    }
  }

  return <Modal open={open} onClose={onClose} title={t('exportTournamentsTitle')} maxWidth={430} actions={<><BtnPrimary onClick={generate} disabled={busy}><FileDown size={15} /> {busy ? t('reportCreating') : 'PDF'}</BtnPrimary><BtnGhost className={styles.excelAction} onClick={generateExcel} disabled={busy}><FileSpreadsheet size={15} /> {busy ? t('reportCreating') : 'EXCEL'}</BtnGhost><BtnGhost onClick={onClose} disabled={busy}>{t('cancel')}</BtnGhost></>}>
    <div className={styles.form}>
      <p>{t('reportSelectYear')}</p>
      <div className={styles.years}><button className={year === 'all' ? styles.active : ''} onClick={() => setYear('all')}>{t('reportAllYears')}</button>{years.map((item) => <button key={item} className={year === item ? styles.active : ''} onClick={() => setYear(item)}>{item}</button>)}</div>
      <div className={styles.count}>{included.length} {t('reportTournaments').toLocaleLowerCase()}</div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  </Modal>
}
