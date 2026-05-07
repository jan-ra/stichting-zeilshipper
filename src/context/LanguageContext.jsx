import { createContext, useContext, useState, useCallback } from 'react'
import { strings } from '../i18n/strings.js'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('sz_lang') || 'nl')

  const toggle = useCallback(() => {
    setLang(prev => {
      const next = prev === 'nl' ? 'en' : 'nl'
      localStorage.setItem('sz_lang', next)
      return next
    })
  }, [])

  // t('nav.cta') — dot-path lookup into strings[lang]
  const t = useCallback((key) => {
    const parts = key.split('.')
    let val = strings[lang]
    for (const p of parts) {
      val = val?.[p]
      if (val === undefined) return key
    }
    return val
  }, [lang])

  // tc(obj, field) — picks obj[field + '_en'] in English, falls back to obj[field]
  const tc = useCallback((obj, field) => {
    if (lang === 'en' && obj[`${field}_en`]) return obj[`${field}_en`]
    return obj[field]
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggle, t, tc }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
