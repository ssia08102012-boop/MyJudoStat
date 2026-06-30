import { useState, useCallback } from 'react'
import { getLang, setLang } from '@/services/i18n'
import type { Lang } from '@/types'

export function useLang() {
  const [lang, setLangState] = useState<Lang>(getLang())

  const changeLang = useCallback((l: Lang) => {
    setLang(l)
    setLangState(l)
  }, [])

  return { lang, changeLang }
}
