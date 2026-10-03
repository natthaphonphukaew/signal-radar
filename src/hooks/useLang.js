import { useCallback, useEffect, useState } from 'react'
import { STRINGS } from '../lib/i18n'

const STORAGE_KEY = 'signal-radar-lang'

function getInitialLang() {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'th' || stored === 'en') return stored
  } catch {
    /* storage blocked — fall through */
  }
  // Default to Thai for Thai browsers, English otherwise.
  return (navigator.language || '').toLowerCase().startsWith('th') ? 'th' : 'en'
}

export function useLangState() {
  const [lang, setLang] = useState(getInitialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* non-fatal */
    }
  }, [lang])

  const toggle = useCallback(() => setLang((l) => (l === 'en' ? 'th' : 'en')), [])
  const t = useCallback((key) => STRINGS[lang][key] ?? STRINGS.en[key] ?? key, [lang])

  return { lang, t, toggle }
}
