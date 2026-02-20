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

const CompassIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
)

const CoinsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const NetworkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>
  </svg>
)

export function Manifesto() {
  const { t } = useI18n()

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
              {t('manifesto.cta.join')}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <h1 className="hero-title">{t('manifesto.page.title')}</h1>
            <p className="hero-subtitle">{t('manifesto.page.subtitle')}</p>

            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/register">
                {t('manifesto.cta.join')}
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
              <div className="feature-card" style={{ gridColumn: 'span 2' as any }}>
                <div className="feature-icon" style={{ background: 'var(--color-primary-alpha-10)', color: 'var(--color-primary)' }}>
                  <CompassIcon />
                </div>
                <h3 className="feature-title">{t('manifesto.section.interest.title')}</h3>
                <p className="feature-desc">{t('manifesto.section.interest.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--color-secondary-alpha-10)', color: 'var(--color-secondary-light)' }}>
                  <CoinsIcon />
                </div>
                <h3 className="feature-title">{t('manifesto.option.trv.title')}</h3>
                <p className="feature-desc">{t('manifesto.option.trv.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--color-success-alpha-10)', color: 'var(--color-success)' }}>
                  <UsersIcon />
                </div>
                <h3 className="feature-title">{t('manifesto.option.join.title')}</h3>
                <p className="feature-desc">{t('manifesto.option.join.body')}</p>
              </div>

              <div className="feature-card" style={{ gridColumn: 'span 2' as any }}>
                <div className="feature-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  <NetworkIcon />
                </div>
                <h3 className="feature-title">{t('manifesto.option.connections.title')}</h3>
                <p className="feature-desc">{t('manifesto.option.connections.body')}</p>
              </div>

              <div className="feature-card" style={{ gridColumn: 'span 2' as any, background: 'var(--gradient-card)' }}>
                <div className="feature-icon" style={{ background: 'var(--color-primary-alpha-10)', color: 'var(--color-primary)' }}>
                  <CompassIcon />
                </div>
                <h3 className="feature-title">{t('manifesto.section.next.title')}</h3>
                <p className="feature-desc">{t('manifesto.section.next.body')}</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                  <Link className="btn btn-primary" to="/register">
                    {t('manifesto.cta.createAccount')}
                  </Link>
                  <Link className="btn btn-secondary" to="/security">
                    {t('manifesto.cta.security')}
                  </Link>
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
