import { useState, useCallback } from 'react'
import { useComps } from '@/hooks/useComps'
import { useProfile } from '@/hooks/useProfile'
import { useLang } from '@/hooks/useLang'
import { t } from '@/services/i18n'
import type { Lang, Tournament } from '@/types'
import styles from './App.module.css'

import Toolbar from '@/components/UI/Toolbar'
import Hero from '@/components/Hero/Hero'
import Stats from '@/components/Stats/Stats'
import Tournaments from '@/components/Tournaments/Tournaments'
import Footer from '@/components/UI/Footer'
import Toast from '@/components/UI/Toast'
import TournamentModal from '@/components/Modals/TournamentModal'
import FightModal from '@/components/Modals/FightModal'
import BackupModal from '@/components/Modals/BackupModal'

type ModalState =
  | { type: 'none' }
  | { type: 'addTournament' }
  | { type: 'editTournament'; comp: Tournament }
  | { type: 'fight'; comp: Tournament; fi: number }
  | { type: 'backup' }

export default function App() {
  const { lang, changeLang } = useLang()
  const { comps, loading, updateComps, addComp, editComp, deleteComp } = useComps()
  const { profile, photosReady, updateProfile } = useProfile()

  const [activeYear, setActiveYear] = useState<number | 'all'>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function closeModal() {
    setModal({ type: 'none' })
  }

  const handleSaveTournament = useCallback(async (comp: Tournament) => {
    const isEdit = comps.some((c) => c.id === comp.id)
    if (isEdit) {
      await editComp(comp)
    } else {
      await addComp(comp)
    }
    showToast(t('saved'))
  }, [comps, editComp, addComp])

  const handleFightSaved = useCallback(async () => {
    // Spread to new array so React re-renders TournamentCard bubbles with updated fight details
    await updateComps([...comps])
  }, [comps, updateComps])

  const handleImport = useCallback(async (imported: Tournament[]) => {
    await updateComps(imported)
  }, [updateComps])

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
        onAddTournament={() => setModal({ type: 'addTournament' })}
        onOpenBackup={() => setModal({ type: 'backup' })}
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
          <span className="sh-paw">柔</span>
          <div className="sh-title">{t('statistics')}</div>
          <span className="sh-paw">道</span>
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
          <span className="sh-paw">勝</span>
          <div className="sh-title">{t('competitions')}</div>
          <span className="sh-paw">負</span>
          <div className="sh-line rev" />
        </section>

        <Tournaments
          comps={filtered}
          allComps={comps}
          onEdit={(comp) => setModal({ type: 'editTournament', comp })}
          onDelete={deleteComp}
          onAdd={addComp}
          onOpenFight={(comp, fi) => setModal({ type: 'fight', comp, fi })}
          showToast={showToast}
          lang={lang}
        />
      </main>

      <Footer />
      {toast && <Toast message={toast} />}

      <TournamentModal
        open={modal.type === 'addTournament' || modal.type === 'editTournament'}
        initial={modal.type === 'editTournament' ? modal.comp : null}
        onClose={closeModal}
        onSave={handleSaveTournament}
      />

      <FightModal
        open={modal.type === 'fight'}
        comp={modal.type === 'fight' ? modal.comp : null}
        fi={modal.type === 'fight' ? modal.fi : 0}
        onClose={closeModal}
        onSaved={handleFightSaved}
      />

      <BackupModal
        open={modal.type === 'backup'}
        comps={comps}
        onClose={closeModal}
        onImport={handleImport}
        showToast={showToast}
      />
    </div>
  )
}
