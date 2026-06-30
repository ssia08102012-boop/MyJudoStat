import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      MY JUDO STAT · 柔道 · {new Date().getFullYear()}
    </footer>
  )
}
