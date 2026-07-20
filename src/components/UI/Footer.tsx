import { VERSION } from '@/version'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      MY JUDO STAT · 柔道 · {new Date().getFullYear()}
      <span className={styles.version}>{VERSION}</span>
    </footer>
  )
}
