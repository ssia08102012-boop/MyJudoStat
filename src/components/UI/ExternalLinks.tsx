import { useState, useRef, useEffect } from 'react'
import { ExternalLink, KeyRound, Eye, EyeOff, Copy, Check, Trash2, X } from 'lucide-react'
import logoRys from '@/assets/logo-rys.webp'
import { getSiteCredentials, saveSiteCred, deleteSiteCred, type SiteCred } from '@/services/storage'
import styles from './ExternalLinks.module.css'

interface LinkItem {
  name: string
  sub: string
  url: string
  color: string
  abbr: string
  domain: string
  logo?: string
}

const LINKS: LinkItem[] = [
  { name: 'IJF Judo',       sub: 'International Judo Federation',  url: 'https://www.ijf.org',                   color: '#1a3a7a', abbr: 'IJF', domain: 'ijf.org' },
  { name: 'JudoTV',         sub: 'Офіційне стримінгове ТБ дзюдо',  url: 'https://www.judotv.com',                color: '#c8922a', abbr: 'TV',  domain: 'judotv.com' },
  { name: 'Judo Mobile',    sub: 'Polski Związek Judo',             url: 'https://pzjudo.pl',                     color: '#cc0000', abbr: 'PZJ', domain: 'pzjudo.pl' },
  { name: 'SportsManago',   sub: 'Klub Judo Ryś · konto',          url: 'https://sportsmanago.pl',               color: '#1a7abf', abbr: 'SM',  domain: 'sportsmanago.pl' },
  { name: 'JudoManager',    sub: 'Wyniki zawodów · Polska',         url: 'https://judomanager.eu',                color: '#222222', abbr: 'JM',  domain: 'judomanager.eu' },
  { name: 'Klub Judo Ryś',  sub: 'Ranking & Kalendarz',             url: 'https://judo-rys.pl/rank/sum.php',      color: '#e8720a', abbr: 'RYŚ', domain: 'judo-rys.pl', logo: logoRys },
]

const FAVICON_SOURCES = (domain: string) => [
  `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
]

function LogoBadge({ link }: { link: LinkItem }) {
  const [srcIdx, setSrcIdx] = useState(0)
  if (link.logo) {
    return (
      <div className={styles.logoBadge} style={{ background: link.color }}>
        <img src={link.logo} alt="" className={styles.localImg} />
      </div>
    )
  }
  const sources = FAVICON_SOURCES(link.domain)
  if (srcIdx >= sources.length) {
    return <div className={styles.abbr} style={{ background: link.color }}>{link.abbr}</div>
  }
  return (
    <div className={styles.logoBadge}>
      <img key={srcIdx} src={sources[srcIdx]} alt="" className={styles.faviconImg} onError={() => setSrcIdx((i) => i + 1)} />
    </div>
  )
}

function useCopyFlash() {
  const [copied, setCopied] = useState<string | null>(null)
  function flash(label: string, text: string) {
    void navigator.clipboard.writeText(text).catch(() => {})
    setCopied(label)
    setTimeout(() => setCopied(null), 1800)
  }
  return { copied, flash }
}

interface CredPanelProps {
  link: LinkItem
  cred: SiteCred | undefined
  onSave: (c: SiteCred) => void
  onDelete: () => void
  onClose: () => void
  onOpen: () => void
}

function CredPanel({ link, cred, onSave, onDelete, onClose, onOpen }: CredPanelProps) {
  const [editing, setEditing] = useState(!cred)
  const [username, setUsername] = useState(cred?.username ?? '')
  const [password, setPassword] = useState(cred?.password ?? '')
  const [showPwd, setShowPwd] = useState(false)
  const { copied, flash } = useCopyFlash()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function handleSave() {
    if (!username.trim()) return
    onSave({ username: username.trim(), password: password.trim() })
    setEditing(false)
  }

  return (
    <div ref={panelRef} className={styles.credPanel} style={{ '--accent': link.color } as React.CSSProperties}>
      <div className={styles.credHeader}>
        <KeyRound size={13} color={link.color} />
        <span className={styles.credTitle}>{link.name}</span>
        <button className={styles.credClose} onClick={onClose}><X size={13} /></button>
      </div>

      {editing ? (
        <div className={styles.credForm}>
          <input
            className={styles.credInput}
            placeholder="Логін / Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <div className={styles.pwdRow}>
            <input
              className={styles.credInput}
              placeholder="Пароль"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button className={styles.pwdToggle} onClick={() => setShowPwd((s) => !s)}>
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className={styles.credActions}>
            <button className={styles.credSaveBtn} onClick={handleSave}>Зберегти</button>
            {cred && <button className={styles.credCancelBtn} onClick={() => setEditing(false)}>Скасувати</button>}
          </div>
        </div>
      ) : (
        <div className={styles.credView}>
          <div className={styles.credRow}>
            <span className={styles.credLbl}>Логін</span>
            <span className={styles.credVal}>{cred!.username}</span>
            <button className={styles.copyBtn} onClick={() => flash('user', cred!.username)}>
              {copied === 'user' ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
            </button>
          </div>
          <div className={styles.credRow}>
            <span className={styles.credLbl}>Пароль</span>
            <span className={styles.credVal}>{showPwd ? cred!.password : '••••••••'}</span>
            <button className={styles.copyBtn} onClick={() => setShowPwd((s) => !s)}>
              {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button className={styles.copyBtn} onClick={() => flash('pwd', cred!.password)}>
              {copied === 'pwd' ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
            </button>
          </div>
          <div className={styles.credActions}>
            <button className={styles.credOpenBtn} onClick={onOpen}>
              Відкрити сайт
              <ExternalLink size={12} />
            </button>
            <button className={styles.credEditBtn} onClick={() => setEditing(true)}>Змінити</button>
            <button className={styles.credDeleteBtn} onClick={onDelete}><Trash2 size={13} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExternalLinks() {
  const [creds, setCreds] = useState<Record<string, SiteCred>>(getSiteCredentials)
  const [openPanel, setOpenPanel] = useState<string | null>(null)

  function reloadCreds() {
    setCreds(getSiteCredentials())
  }

  function handleCardClick(e: React.MouseEvent, link: LinkItem) {
    const hasCred = Boolean(creds[link.domain])
    if (hasCred) {
      e.preventDefault()
      setOpenPanel((p) => (p === link.domain ? null : link.domain))
    }
  }

  function handleKeyIcon(e: React.MouseEvent, domain: string) {
    e.preventDefault()
    e.stopPropagation()
    setOpenPanel((p) => (p === domain ? null : domain))
  }

  return (
    <div className={styles.wrap}>
      {LINKS.map((link) => {
        const cred = creds[link.domain]
        const isOpen = openPanel === link.domain

        return (
          <div key={link.name} className={styles.cardWrap}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={`${styles.card} ${cred ? styles.hasCred : ''}`}
              style={{ '--accent': link.color } as React.CSSProperties}
              onClick={(e) => handleCardClick(e, link)}
            >
              <LogoBadge link={link} />
              <div className={styles.info}>
                <div className={styles.name}>{link.name}</div>
                <div className={styles.sub}>{link.sub}</div>
              </div>
              {cred && <KeyRound size={13} className={styles.credIndicator} color={link.color} />}
              <button
                className={`${styles.keyBtn} ${cred ? styles.keyBtnActive : ''}`}
                onClick={(e) => handleKeyIcon(e, link.domain)}
                title={cred ? 'Переглянути / змінити дані входу' : 'Зберегти дані входу'}
                style={{ '--accent': link.color } as React.CSSProperties}
              >
                <KeyRound size={14} />
              </button>
              {!cred && <ExternalLink size={13} className={styles.icon} />}
            </a>

            {isOpen && (
              <CredPanel
                link={link}
                cred={cred}
                onSave={(c) => { saveSiteCred(link.domain, c); reloadCreds() }}
                onDelete={() => { deleteSiteCred(link.domain); reloadCreds(); setOpenPanel(null) }}
                onClose={() => setOpenPanel(null)}
                onOpen={() => { window.open(link.url, '_blank', 'noreferrer'); setOpenPanel(null) }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
