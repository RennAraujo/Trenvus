import { Link } from 'react-router-dom'
import { LanguageSwitcher, useI18n } from '../i18n'
import brandLogo from '../assets/brand-mark.png'

// Icons
const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

const UserCheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
  </svg>
)

const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
)

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function Security() {
  const { t } = useI18n()

  const techLines = splitLines(t('security.tech.list'))

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <Link to="/" className="brand">
              <img className="brand-logo" src={brandLogo} alt="TRENVUS" />
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-3">
            <Link className="btn btn-ghost btn-sm hidden sm:flex" to="/">
              <ArrowLeftIcon />
              {t('actions.previous')}
            </Link>
            <Link className="btn btn-primary" to="/register">
              {t('security.cta.createAccount')}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <h1 className="hero-title">{t('security.page.title')}</h1>
            <p className="hero-subtitle">{t('security.page.subtitle')}</p>

            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/register">
                {t('security.cta.createAccount')}
                <ArrowRightIcon />
              </Link>
              <Link className="btn btn-secondary btn-lg" to="/login">
                {t('actions.login')}
              </Link>
            </div>
          </div>
        </section>

        <section style={{ padding: '60px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--color-primary-alpha-10)', color: 'var(--color-primary)' }}>
                  <ShieldIcon />
                </div>
                <h3 className="feature-title">{t('security.card.identity.title')}</h3>
                <p className="feature-desc">{t('security.card.identity.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--color-secondary-alpha-10)', color: 'var(--color-secondary-light)' }}>
                  <LockIcon />
                </div>
                <h3 className="feature-title">{t('security.card.passwords.title')}</h3>
                <p className="feature-desc">{t('security.card.passwords.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--color-success-alpha-10)', color: 'var(--color-success)' }}>
                  <RefreshIcon />
                </div>
                <h3 className="feature-title">{t('security.card.refresh.title')}</h3>
                <p className="feature-desc">{t('security.card.refresh.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  <CheckIcon />
                </div>
                <h3 className="feature-title">{t('security.card.validation.title')}</h3>
                <p className="feature-desc">{t('security.card.validation.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  <WalletIcon />
                </div>
                <h3 className="feature-title">{t('security.card.balance.title')}</h3>
                <p className="feature-desc">{t('security.card.balance.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  <UserCheckIcon />
                </div>
                <h3 className="feature-title">{t('security.card.control.title')}</h3>
                <p className="feature-desc">{t('security.card.control.body')}</p>
              </div>

              <div className="feature-card" style={{ gridColumn: 'span 2' as any }}>
                <div className="feature-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  <CodeIcon />
                </div>
                <h3 className="feature-title">{t('security.tech.title')}</h3>
                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  {techLines.map((line) => (
                    <div key={line} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '40px 0', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={brandLogo} alt="TRENVUS" style={{ height: 32 }} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                © 2026 Trenvus. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
