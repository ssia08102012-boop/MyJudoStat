import { Plus, Cloud, Trophy, Globe, Moon, NotebookPen, Sun, UsersRound } from 'lucide-react'
import { t } from '@/services/i18n'
import type { Lang } from '@/types'
import styles from './Toolbar.module.css'

interface Props {
  lang: Lang
  onChangeLang: (l: Lang) => void
  onAddTournament: () => void
  onOpenBackup: () => void
  onOpenDiary: () => void
  onOpenPartner: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

const LANGS: Lang[] = ['uk', 'en', 'pl']

export default function Toolbar({ lang, onChangeLang, onAddTournament, onOpenBackup, onOpenDiary, onOpenPartner, theme, onToggleTheme }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <button className={styles.tbBtn} onClick={onOpenDiary}>
          <NotebookPen size={15} strokeWidth={2} />
          <span>{t('diaryShort')}</span>
        </button>
        <button className={styles.tbBtn} onClick={onOpenPartner}>
          <UsersRound size={15} strokeWidth={2} />
          <span>{t('partnerShort')}</span>
        </button>
        <button className={`${styles.tbBtn} ${styles.primary}`} onClick={onAddTournament}>
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
        <button className={styles.tbBtn} onClick={onOpenBackup}>
          <Cloud size={15} strokeWidth={2} />
          <span>{t('syncBtn')}</span>
        </button>
      </div>

      <div className={styles.right}>
        <button className={styles.themeBtn} onClick={onToggleTheme} aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')} title={theme === 'dark' ? t('switchToLight') : t('switchToDark')}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
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
