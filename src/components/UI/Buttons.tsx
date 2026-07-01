import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import styles from './Buttons.module.css'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean
  style?: CSSProperties
}

export function BtnPrimary({ children, danger, className, ...rest }: BtnProps) {
  return (
    <button
      className={`${styles.primary} ${danger ? styles.danger : ''} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function BtnGhost({ children, className, ...rest }: BtnProps) {
  return (
    <button className={`${styles.ghost} ${className ?? ''}`} {...rest}>
      {children}
    </button>
  )
}

export function BtnIcon({ children, className, ...rest }: BtnProps) {
  return (
    <button className={`${styles.icon} ${className ?? ''}`} {...rest}>
      {children}
    </button>
  )
}
