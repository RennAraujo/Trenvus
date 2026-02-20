import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { messagesEn } from './i18n.messages.en'
import { messagesPtBR } from './i18n.messages.ptBR'

export type Locale = 'pt-BR' | 'en'

type Messages = Record<string, string>

const MESSAGES: Record<Locale, Messages> = {
  'pt-BR': messagesPtBR,
  en: messagesEn,
}

const STORAGE_KEY = 'exchange.locale'

function isLocale(v: unknown): v is Locale {
  return v === 'pt-BR' || v === 'en'
}

function resolveInitialLocale(): Locale {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
  if (isLocale(stored)) return stored
  const nav = typeof window !== 'undefined' ? window.navigator.language : ''
  if (nav && nav.toLowerCase().startsWith('pt')) return 'pt-BR'
  return 'en'
}

function formatMessage(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
}

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => resolveInitialLocale())

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const t: I18nContextValue['t'] = (key, vars) => {
      const msg = MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key
      return formatMessage(msg, vars)
    }
    return { locale, setLocale, t }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      <button
        type="button"
        className={`lang-option ${locale === 'pt-BR' ? 'active' : ''}`}
        onClick={() => setLocale('pt-BR')}
        aria-pressed={locale === 'pt-BR'}
      >
        {t('lang.pt')}
      </button>
      <button
        type="button"
        className={`lang-option ${locale === 'en' ? 'active' : ''}`}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        {t('lang.en')}
      </button>
    </div>
  )
}
