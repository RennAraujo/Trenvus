import { Link } from 'react-router-dom'
import { LanguageSwitcher, useI18n } from '../i18n'

export function Landing() {
  const { t } = useI18n()

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <LanguageSwitcher />
            <Link to="/" className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <span>TRENVUS</span>
            </Link>
            <nav className="nav">
              <a href="#features">{t('landing.nav.features')}</a>
              <Link to="/security">{t('landing.nav.security')}</Link>
            </nav>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="btn" to="/login">
              {t('actions.login')}
            </Link>
            <Link className="btn btn-primary" to="/register">
              {t('landing.cta.startNow')}
            </Link>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="hero">
            <div>
              <h1 className="title">{t('landing.hero.title')}</h1>
              <p className="subtitle">{t('landing.hero.subtitle')}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                <Link className="btn btn-primary" to="/register">
                  {t('landing.cta.createAccount')}
                </Link>
                <Link className="btn" to="/login">
                  {t('landing.cta.alreadyHaveAccount')}
                </Link>
              </div>

              <div id="features" style={{ marginTop: 22 }} className="grid">
                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill pill-accent">1:1</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('landing.feature.simpleConversion.title')}</h3>
                    <div className="muted">
                      {t('landing.feature.simpleConversion.body')}
                    </div>
                  </div>
                </div>
                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('landing.pill.privacy')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('landing.feature.privacy.title')}</h3>
                    <div className="muted">{t('landing.feature.privacy.body')}</div>
                  </div>
                </div>
                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('landing.pill.market')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('landing.feature.market.title')}</h3>
                    <div className="muted">{t('landing.feature.market.body')}</div>
                  </div>
                </div>
                <div id="security" className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('landing.pill.secure')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('landing.feature.security.title')}</h3>
                    <div className="muted">{t('landing.feature.security.body')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true" />
          </div>
        </div>
      </main>
    </div>
  )
}

