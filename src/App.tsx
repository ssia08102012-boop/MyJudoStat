import { useState } from 'react'
import { useComps } from '@/hooks/useComps'
import { useProfile } from '@/hooks/useProfile'
import { useLang } from '@/hooks/useLang'
import { t } from '@/services/i18n'
import type { Lang } from '@/types'
import styles from './App.module.css'

// Components (to be implemented in subsequent phases)
import Toolbar from '@/components/UI/Toolbar'
import Hero from '@/components/Hero/Hero'
import Stats from '@/components/Stats/Stats'
import Tournaments from '@/components/Tournaments/Tournaments'
import Footer from '@/components/UI/Footer'
import Toast from '@/components/UI/Toast'

export default function App() {
  const { lang, changeLang } = useLang()
  const { comps, loading, addComp, editComp, deleteComp } = useComps()
  const { profile, photosReady, updateProfile } = useProfile()

  const [activeYear, setActiveYear] = useState<number | 'all'>('all')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const filtered = activeYear === 'all'
    ? comps
    : comps.filter((c) => c.year === activeYear)

  if (loading || !photosReady) {
    return (
      <div className={styles.loader}>
        <div className={styles.loaderPaw}>柔道</div>
      </div>
    )
  }

  return (
    <div className={styles.app}>
      <Toolbar
        lang={lang}
        onChangeLang={changeLang as (l: Lang) => void}
        comps={comps}
        onAddComp={addComp}
        showToast={showToast}
      />

      <Hero
        profile={profile}
        comps={comps}
        onUpdateProfile={updateProfile}
        lang={lang}
      />

      <main className={styles.main}>
        <section className="section-head">
          <div className="sh-line" />
          <span className="sh-paw">🐾</span>
          <div className="sh-title">{t('statistics')}</div>
          <span className="sh-paw">🐾</span>
          <div className="sh-line rev" />
        </section>

        <Stats
          comps={comps}
          filtered={filtered}
          activeYear={activeYear}
          onFilterYear={setActiveYear}
          lang={lang}
        />

        <section className="section-head" style={{ marginTop: 4 }}>
          <div className="sh-line" />
          <span className="sh-paw">🥋</span>
          <div className="sh-title">{t('competitions')}</div>
          <span className="sh-paw">🥋</span>
          <div className="sh-line rev" />
        </section>

        <Tournaments
          comps={filtered}
          allComps={comps}
          onEdit={editComp}
          onDelete={deleteComp}
          onAdd={addComp}
          showToast={showToast}
          lang={lang}
        />
      </main>

      <Footer />
      {toast && <Toast message={toast} />}
    </div>
  )
}
