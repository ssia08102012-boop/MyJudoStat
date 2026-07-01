import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import { BtnPrimary, BtnGhost } from './Buttons'
import { t } from '@/services/i18n'

interface Props {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmModal({ open, message, onConfirm, onCancel, danger = false }: Props) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t('confirmation')}
      maxWidth={340}
      actions={
        <>
          <BtnPrimary onClick={onConfirm} danger={danger} style={{ flex: 1 }}>
            {t('deleteBtn')}
          </BtnPrimary>
          <BtnGhost onClick={onCancel} style={{ flex: 1 }}>
            {t('cancel')}
          </BtnGhost>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={20} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6, fontFamily: "'Crimson Pro', serif" }}>
          {message}
        </p>
      </div>
    </Modal>
  )
}
