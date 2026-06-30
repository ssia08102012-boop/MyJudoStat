import { Plus, Cloud, Trophy, Globe } from 'lucide-react'
import { t } from '@/services/i18n'
import type { Lang, Tournament } from '@/types'
import styles from './Toolbar.module.css'

interface Props {
  lang: Lang
  onChangeLang: (l: Lang) => void
  comps: Tournament[]
  onAddComp: (c: Tournament) => Promise<void>
  showToast: (msg: string) => void
}

const LANGS: Lang[] = ['uk', 'en', 'pl']

export default function Toolbar({ lang, onChangeLang }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <button className={styles.tbBtn}>
          <Plus size={15} strokeWidth={2.5} />
          <span>{t('addTournament')}</span>
        </button>
        <a
          className={styles.tbBtn}
          href="https://judo-rys.pl/rank/sum.php"
          target="_blank"
          rel="noreferrer"
        >
          <Trophy size={15} strokeWidth={2} />
          <span>{t('clubRanking')}</span>
        </a>
        <button className={styles.tbBtn}>
          <Cloud size={15} strokeWidth={2} />
          <span>{t('syncBtn')}</span>
        </button>
      </div>

      <div className={styles.right}>
        <Globe size={14} strokeWidth={2} className={styles.globeIcon} />
        {LANGS.map((l) => (
          <button
            key={l}
            className={`${styles.langBtn} ${l === lang ? styles.active : ''}`}
            onClick={() => onChangeLang(l)}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
