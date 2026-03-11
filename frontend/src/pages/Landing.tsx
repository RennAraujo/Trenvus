import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { LanguageSwitcher, useI18n } from '../i18n'
import brandLogo from '../assets/brand-mark.png'

// Icons
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

const TrendingUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
)

export function Landing() {
  const { t } = useI18n()
  const auth = useAuth()

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <Link to="/" className="brand">
              <img className="brand-logo" src={brandLogo} alt="TRENVUS" />
            </Link>
            <LanguageSwitcher />
            <nav className="nav">
              <Link to="/manifesto" className="nav-link">{t('landing.nav.manifesto')}</Link>
              <Link to="/security" className="nav-link">{t('landing.nav.security')}</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {auth.isAuthenticated ? (
              <>
                <Link className="btn btn-primary btn-sm" to="/app">
                  Dashboard
                </Link>
                <button 
                  className="btn btn-ghost btn-sm hidden sm:flex" 
                  onClick={auth.logout}
                  style={{ color: 'var(--color-danger)' }}
                >
                  <LogoutIcon />
                  {t('actions.logout')}
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-ghost btn-sm hidden sm:flex" to="/login">
                  {t('actions.login')}
                </Link>
                <Link className="btn btn-primary" to="/register">
                  {t('landing.cta.startNow')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="hero">
          <div className="container">
            {/* Logo Hero - Efeito Roxo Neon Pulsante */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: 32 
            }}>
              <div style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #C084FC 50%, #A855F7 75%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px #8B5CF6, 0 0 40px #A855F7, 0 0 60px #C084FC, inset 0 0 20px rgba(255,255,255,0.2)',
                animation: 'neonPulse 1.5s ease-in-out infinite',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Brilho interno */}
                <div style={{
                  position: 'absolute',
                  top: '10%',
                  left: '20%',
                  width: '30%',
                  height: '30%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }} />
                
                <img 
                  src={brandLogo} 
                  alt="TRENVUS" 
                  style={{ 
                    width: 80, 
                    height: 80,
                    filter: 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))',
                    position: 'relative',
                    zIndex: 1,
                  }} 
                />
              </div>
            </div>
            <style>{`
              @keyframes neonPulse {
                0%, 100% { 
                  transform: scale(1); 
                  box-shadow: 0 0 20px #8B5CF6, 0 0 40px #A855F7, 0 0 60px #C084FC, inset 0 0 20px rgba(255,255,255,0.2);
                }
                50% { 
                  transform: scale(1.08); 
                  box-shadow: 0 0 30px #8B5CF6, 0 0 60px #A855F7, 0 0 90px #C084FC, 0 0 120px #E9D5FF, inset 0 0 30px rgba(255,255,255,0.3);
                }
              }
            `}</style>

            <h1 className="hero-title">{t('landing.hero.title')}</h1>
            <p className="hero-subtitle">{t('landing.hero.subtitle')}</p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/register">
                {t('landing.cta.createAccount')}
                <ArrowRightIcon />
              </Link>
              <Link className="btn btn-secondary btn-lg" to="/login">
                {t('landing.cta.alreadyHaveAccount')}
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <ZapIcon />
                </div>
                <h3 className="feature-title">{t('landing.feature.simpleConversion.title')}</h3>
                <p className="feature-desc">{t('landing.feature.simpleConversion.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--color-secondary-alpha-10)', color: 'var(--color-secondary-light)' }}>
                  <LockIcon />
                </div>
                <h3 className="feature-title">{t('landing.feature.privacy.title')}</h3>
                <p className="feature-desc">{t('landing.feature.privacy.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--color-success-alpha-10)', color: 'var(--color-success)' }}>
                  <TrendingUpIcon />
                </div>
                <h3 className="feature-title">{t('landing.feature.market.title')}</h3>
                <p className="feature-desc">{t('landing.feature.market.body')}</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  <ShieldIcon />
                </div>
                <h3 className="feature-title">{t('landing.feature.security.title')}</h3>
                <p className="feature-desc">{t('landing.feature.security.body')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section style={{ padding: '80px 0', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div className="grid grid-cols-4 md:grid-cols-2 sm:grid-cols-1" style={{ gap: 32, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>1:1</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>USD to TRV Rate</div>
              </div>
              <div>
                <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>1%</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Conversion Fee</div>
              </div>
              <div>
                <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>24/7</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Always Online</div>
              </div>
              <div>
                <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>100%</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Secure</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '100px 0', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
              Ready to get started?
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 16 }}>
              Join thousands of users who trust Trenvus for their digital currency needs.
            </p>
            <div style={{ marginTop: 32 }}>
              <Link className="btn btn-primary btn-lg" to="/register">
                Create Free Account
                <ArrowRightIcon />
              </Link>
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
