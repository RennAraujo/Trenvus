import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Locale = 'pt-BR' | 'en'

type Messages = Record<string, string>

const MESSAGES: Record<Locale, Messages> = {
  'pt-BR': {
    'lang.pt': 'PT-BR',
    'lang.en': 'EN',

    'nav.dashboard': 'Dashboard',
    'nav.statement': 'Extrato',
    'nav.market': 'Mercado',

    'actions.logout': 'Sair',
    'actions.login': 'Entrar',
    'actions.register': 'Criar conta',
    'actions.createNow': 'Criar agora',
    'actions.testAccount': 'Conta teste',
    'actions.loginTestAccount': 'Entrar com conta teste',
    'actions.updating': 'Atualizando...',
    'actions.update': 'Atualizar',
    'actions.updateBalance': 'Atualizar saldo',
    'actions.orderBook': 'Livro',
    'actions.updateOrderBook': 'Atualizar livro',
    'actions.previous': 'Anterior',
    'actions.next': 'Próximo',

    'labels.email': 'E-mail',
    'labels.password': 'Senha',
    'labels.amountUsd': 'Valor (USD)',
    'labels.amountByCurrency': 'Valor ({currency})',
    'labels.available': 'Disponível',
    'labels.instrument': 'Instrumento',
    'labels.usd': 'USD',
    'labels.price': 'Preço',
    'labels.change24h': '24h',
    'labels.bidAsk': 'Bid/Ask',
    'labels.highLow': 'High/Low',
    'labels.spread': 'Spread',
    'labels.orderBookTitle': 'Livro de ofertas',
    'labels.asks': 'Asks (venda)',
    'labels.bids': 'Bids (compra)',
    'labels.sparklineAria': 'minigráfico',

    'dashboard.subtitle': 'Saldo, depósito e conversão USD ↔ VPS (1:1).',
    'dashboard.usdBalance': 'Saldo USD',
    'dashboard.vpsBalance': 'Saldo VPS',
    'dashboard.vpsRate': '1 VPS = 1 USD',
    'dashboard.deposit.title': 'Depositar USD',
    'dashboard.deposit.help': 'Simulação de depósito (MVP). Informe um valor com 2 casas decimais.',
    'dashboard.deposit.submit': 'Depositar',
    'dashboard.convert.title': 'Converter',
    'dashboard.convert.usdToVps': 'USD → VPS',
    'dashboard.convert.vpsToUsd': 'VPS → USD',
    'dashboard.convert.feeLine': 'Câmbio 1:1. Taxa fixa: {fee} USD por transação.',
    'dashboard.convert.submit': 'Converter',

    'statement.title': 'Extrato privado',
    'statement.subtitle': 'Apenas valores são exibidos para manter privacidade.',
    'statement.empty': 'Sem transações',

    'market.title': 'Mercado',
    'market.subtitle': 'Acompanhe preços, variação 24h e livro de ofertas (OKX Market Data).',

    'login.title': 'Entrar',
    'login.subtitle': 'Acesse seu dashboard para depositar USD e converter para VPS.',
    'login.loading': 'Entrando...',
    'login.noAccount': 'Não tem conta?',

    'register.title': 'Criar conta',
    'register.subtitle': 'Crie sua conta para ver saldo, extrato privado e acompanhar o mercado.',
    'register.loading': 'Criando...',
    'register.haveAccount': 'Já tem conta?',

    'landing.nav.features': 'Recursos',
    'landing.nav.security': 'Segurança',
    'landing.cta.startNow': 'Comece sua jornada agora',
    'landing.hero.title': 'Bem-vindo ao amanhã-hoje!',
    'landing.hero.subtitle':
      'Deposite USD e converta para VPS com câmbio 1:1, com uma taxa fixa e transparente por transação. Controle total, interface moderna e segurança no backend.',
    'landing.cta.createAccount': 'Criar conta',
    'landing.cta.alreadyHaveAccount': 'Já tenho conta',
    'landing.feature.simpleConversion.title': 'Conversão simples',
    'landing.feature.simpleConversion.body': 'USD → VPS sem variação de câmbio. A taxa é fixa: 0,50 USD por conversão.',
    'landing.pill.privacy': 'Privacidade',
    'landing.pill.market': 'Mercado',
    'landing.pill.secure': 'Seguro',
    'landing.feature.privacy.title': 'Extrato privado',
    'landing.feature.privacy.body': 'O extrato exibe apenas valores, reduzindo exposição de informações.',
    'landing.feature.market.title': 'Acompanhe preços',
    'landing.feature.market.body': 'Painel de mercado com preços e variação 24h para ativos configuráveis.',
    'landing.feature.security.title': 'Transação segura',
    'landing.feature.security.body': 'JWT assinado (RS256), senhas com BCrypt, validações e controle de concorrência no saldo.',

    'errors.loadBalance': 'Falha ao carregar saldo',
    'errors.deposit': 'Falha ao depositar',
    'errors.convert': 'Falha ao converter',
    'errors.loadStatement': 'Falha ao carregar extrato',
    'errors.loadMarket': 'Falha ao carregar mercado',
    'errors.loadOrderBook': 'Falha ao carregar livro de ofertas',
    'errors.login': 'Falha ao entrar',
    'errors.loginTestAccount': 'Falha ao entrar com conta de teste',
    'errors.register': 'Falha ao criar conta',
  },
  en: {
    'lang.pt': 'PT-BR',
    'lang.en': 'EN',

    'nav.dashboard': 'Dashboard',
    'nav.statement': 'Statement',
    'nav.market': 'Market',

    'actions.logout': 'Logout',
    'actions.login': 'Login',
    'actions.register': 'Create account',
    'actions.createNow': 'Create now',
    'actions.testAccount': 'Test account',
    'actions.loginTestAccount': 'Login with test account',
    'actions.updating': 'Updating...',
    'actions.update': 'Refresh',
    'actions.updateBalance': 'Refresh balance',
    'actions.orderBook': 'Book',
    'actions.updateOrderBook': 'Refresh book',
    'actions.previous': 'Previous',
    'actions.next': 'Next',

    'labels.email': 'Email',
    'labels.password': 'Password',
    'labels.amountUsd': 'Amount (USD)',
    'labels.amountByCurrency': 'Amount ({currency})',
    'labels.available': 'Available',
    'labels.instrument': 'Instrument',
    'labels.usd': 'USD',
    'labels.price': 'Price',
    'labels.change24h': '24h',
    'labels.bidAsk': 'Bid/Ask',
    'labels.highLow': 'High/Low',
    'labels.spread': 'Spread',
    'labels.orderBookTitle': 'Order book',
    'labels.asks': 'Asks (sell)',
    'labels.bids': 'Bids (buy)',
    'labels.sparklineAria': 'sparkline',

    'dashboard.subtitle': 'Balance, deposits, and USD ↔ VPS conversion (1:1).',
    'dashboard.usdBalance': 'USD Balance',
    'dashboard.vpsBalance': 'VPS Balance',
    'dashboard.vpsRate': '1 VPS = 1 USD',
    'dashboard.deposit.title': 'Deposit USD',
    'dashboard.deposit.help': 'Deposit simulation (MVP). Enter an amount with 2 decimal places.',
    'dashboard.deposit.submit': 'Deposit',
    'dashboard.convert.title': 'Convert',
    'dashboard.convert.usdToVps': 'USD → VPS',
    'dashboard.convert.vpsToUsd': 'VPS → USD',
    'dashboard.convert.feeLine': 'Rate 1:1. Fixed fee: {fee} USD per transaction.',
    'dashboard.convert.submit': 'Convert',

    'statement.title': 'Private statement',
    'statement.subtitle': 'Only values are shown to preserve privacy.',
    'statement.empty': 'No transactions',

    'market.title': 'Market',
    'market.subtitle': 'Track prices, 24h change, and the order book (OKX Market Data).',

    'login.title': 'Login',
    'login.subtitle': 'Access your dashboard to deposit USD and convert to VPS.',
    'login.loading': 'Logging in...',
    'login.noAccount': "Don't have an account?",

    'register.title': 'Create account',
    'register.subtitle': 'Create your account to see balances, private statements, and follow the market.',
    'register.loading': 'Creating...',
    'register.haveAccount': 'Already have an account?',

    'landing.nav.features': 'Features',
    'landing.nav.security': 'Security',
    'landing.cta.startNow': 'Start your Journey Now',
    'landing.hero.title': 'Welcome to tomorrow-today!',
    'landing.hero.subtitle':
      'Deposit USD and convert to VPS at a 1:1 rate, with a fixed and transparent fee per transaction. Full control, modern UI, and secure backend.',
    'landing.cta.createAccount': 'Create account',
    'landing.cta.alreadyHaveAccount': 'I already have an account',
    'landing.feature.simpleConversion.title': 'Simple conversion',
    'landing.feature.simpleConversion.body': 'USD → VPS without FX fluctuations. Fixed fee: 0.50 USD per conversion.',
    'landing.pill.privacy': 'Privacy',
    'landing.pill.market': 'Market',
    'landing.pill.secure': 'Secure',
    'landing.feature.privacy.title': 'Private statement',
    'landing.feature.privacy.body': 'The statement shows values only, reducing information exposure.',
    'landing.feature.market.title': 'Track prices',
    'landing.feature.market.body': 'Market panel with prices and 24h change for configurable assets.',
    'landing.feature.security.title': 'Secure transaction',
    'landing.feature.security.body': 'Signed JWT (RS256), BCrypt passwords, validations, and balance concurrency controls.',

    'errors.loadBalance': 'Failed to load balance',
    'errors.deposit': 'Failed to deposit',
    'errors.convert': 'Failed to convert',
    'errors.loadStatement': 'Failed to load statement',
    'errors.loadMarket': 'Failed to load market',
    'errors.loadOrderBook': 'Failed to load order book',
    'errors.login': 'Login failed',
    'errors.loginTestAccount': 'Test account login failed',
    'errors.register': 'Failed to create account',
  },
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
    <div className="lang-switch" role="group" aria-label="Language">
      <button
        type="button"
        className={locale === 'pt-BR' ? 'btn btn-small btn-primary' : 'btn btn-small'}
        onClick={() => setLocale('pt-BR')}
        aria-pressed={locale === 'pt-BR'}
      >
        {t('lang.pt')}
      </button>
      <button
        type="button"
        className={locale === 'en' ? 'btn btn-small btn-primary' : 'btn btn-small'}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        {t('lang.en')}
      </button>
    </div>
  )
}
