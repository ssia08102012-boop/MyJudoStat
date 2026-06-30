import { useState } from 'react'
import { Download, Upload, CloudUpload, CloudDownload, Key, Info } from 'lucide-react'
import Modal from '@/components/UI/Modal'
import { BtnPrimary, BtnGhost } from '@/components/UI/Buttons'
import { t } from '@/services/i18n'
import { exportBackup, importBackup } from '@/services/storage'
import { syncPush, syncPull } from '@/services/supabase'
import type { Tournament } from '@/types'
import styles from './BackupModal.module.css'

interface Props {
  open: boolean
  comps: Tournament[]
  onClose: () => void
  onImport: (comps: Tournament[]) => void
  showToast: (msg: string) => void
}

export default function BackupModal({ open, comps, onClose, onImport, showToast }: Props) {
  const [syncId, setSyncId] = useState(localStorage.getItem('judo_sync_id') ?? '')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [idInput, setIdInput] = useState(localStorage.getItem('judo_sync_id') ?? '')
  const [showIdSetup, setShowIdSetup] = useState(false)

  async function handleExport() {
    await exportBackup(comps)
    showToast(t('backupDone'))
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importBackup(file)
      onImport(imported)
      showToast(t('importOk'))
      onClose()
    } catch {
      showToast(t('importErr'))
    } finally {
      e.target.value = ''
    }
  }

  async function handlePush() {
    if (!syncId) { setShowIdSetup(true); return }
    setSyncStatus('loading')
    try {
      await syncPush(comps)
      setSyncStatus('ok')
      showToast(t('syncOk'))
    } catch {
      setSyncStatus('err')
      showToast(t('syncErr'))
    }
  }

  async function handlePull() {
    if (!syncId) { setShowIdSetup(true); return }
    setSyncStatus('loading')
    try {
      const { comps: pulled } = await syncPull()
      if (pulled) {
        onImport(pulled)
        showToast(t('syncOk'))
        onClose()
      } else {
        showToast('Хмара порожня')
      }
      setSyncStatus('ok')
    } catch {
      setSyncStatus('err')
      showToast(t('syncErr'))
    }
  }

  function saveId() {
    const id = idInput.trim()
    if (!id) return
    localStorage.setItem('judo_sync_id', id)
    setSyncId(id)
    setShowIdSetup(false)
    showToast('ID збережено!')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="💾 BACKUP"
      maxWidth={460}
      actions={<BtnGhost onClick={onClose} style={{ flex: 1 }}>{t('close')}</BtnGhost>}
    >
      {/* Export */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('export')}</div>
        <BtnPrimary onClick={handleExport} style={{ width: '100%' }}>
          <Download size={14} /> {t('downloadBackup')}
        </BtnPrimary>
      </div>

      {/* Import */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('import')}</div>
        <p className={styles.warn}>{t('importWarn')}</p>
        <label className={styles.dropzone}>
          <Upload size={18} />
          <span>{t('dropFile')}</span>
          <input type="file" accept=".json" onChange={handleImport} className={styles.hidden} />
        </label>
      </div>

      {/* Cloud sync */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>☁️ ХМАРНА СИНХРОНІЗАЦІЯ</div>
        <div className={styles.syncIdRow}>
          <span className={styles.syncIdLabel}>ID:</span>
          <span className={styles.syncIdVal}>{syncId || 'не налаштовано'}</span>
          {syncStatus === 'loading' && <span className={styles.syncing}>{t('syncing')}</span>}
          {syncStatus === 'ok'      && <span className={styles.syncOk}>✓</span>}
          {syncStatus === 'err'     && <span className={styles.syncErr}>✗</span>}
        </div>
        <div className={styles.syncBtns}>
          <BtnPrimary onClick={handlePush} style={{ flex: 1 }}>
            <CloudUpload size={14} /> {t('syncPush')}
          </BtnPrimary>
          <BtnGhost onClick={handlePull} style={{ flex: 1 }}>
            <CloudDownload size={14} /> {t('syncPull')}
          </BtnGhost>
        </div>
        <button className={styles.setupBtn} onClick={() => setShowIdSetup((s) => !s)}>
          <Key size={12} /> {t('syncSetupBtn')}
        </button>
        {showIdSetup && (
          <div className={styles.idSetup}>
            <input
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder="Введіть ваш унікальний ID"
            />
            <BtnPrimary onClick={saveId} style={{ width: '100%' }}>Зберегти ID</BtnPrimary>
          </div>
        )}
      </div>

      {/* Storage info */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}><Info size={12} /> {t('storage')}</div>
        <p className={styles.storageInfo} dangerouslySetInnerHTML={{ __html: t('storageInfo') }} />
      </div>
    </Modal>
  )
}
