import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  maxWidth?: number
  children: ReactNode
  actions?: ReactNode
}

export default function Modal({ open, onClose, title, maxWidth = 560, children, actions }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.modal} style={{ maxWidth }}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
        </div>
        <div className={styles.body}>{children}</div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  )
}
