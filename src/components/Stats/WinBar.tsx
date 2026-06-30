import { t } from '@/services/i18n'
import styles from './WinBar.module.css'

interface Props {
  wins: number
  losses: number
  winRate: number
}

export default function WinBar({ wins, losses, winRate }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.labels}>
        <span><span>{t('won')}</span>: <b>{wins}</b></span>
        <span className={styles.pct}>{winRate}%</span>
        <span><span>{t('lost')}</span>: <b>{losses}</b></span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${winRate}%` }} />
      </div>
    </div>
  )
}
