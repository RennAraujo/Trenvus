import { Link } from 'react-router-dom'
import { LanguageSwitcher, useI18n } from '../i18n'

export function Manifesto() {
  const { t } = useI18n()

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <LanguageSwitcher />
            <Link to="/" className="brand">
              <img className="brand-logo" src="/brand-mark.png" alt="TRENVUS" />
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="btn" to="/">
              {t('actions.previous')}
            </Link>
            <Link className="btn btn-primary" to="/register">
              {t('manifesto.cta.join')}
            </Link>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="hero">
            <div>
              <h1 className="title">{t('manifesto.page.title')}</h1>
              <p className="subtitle">{t('manifesto.page.subtitle')}</p>

              <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                <Link className="btn btn-primary" to="/register">
                  {t('manifesto.cta.join')}
                </Link>
                <Link className="btn" to="/login">
                  {t('actions.login')}
                </Link>
              </div>

              <div style={{ marginTop: 22 }} className="grid">
                <div className="col-12 card">
                  <div className="card-inner">
                    <div className="pill pill-accent">{t('manifesto.pill.direction')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('manifesto.section.interest.title')}</h3>
                    <div className="muted">{t('manifesto.section.interest.body')}</div>
                  </div>
                </div>

                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('manifesto.option.trv.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('manifesto.option.trv.title')}</h3>
                    <div className="muted">{t('manifesto.option.trv.body')}</div>
                  </div>
                </div>

                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('manifesto.option.join.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('manifesto.option.join.title')}</h3>
                    <div className="muted">{t('manifesto.option.join.body')}</div>
                  </div>
                </div>

                <div className="col-12 card">
                  <div className="card-inner">
                    <div className="pill">{t('manifesto.option.connections.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('manifesto.option.connections.title')}</h3>
                    <div className="muted">{t('manifesto.option.connections.body')}</div>
                  </div>
                </div>

                <div className="col-12 card">
                  <div className="card-inner">
                    <div className="pill pill-accent">{t('manifesto.pill.next')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('manifesto.section.next.title')}</h3>
                    <div className="muted">{t('manifesto.section.next.body')}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                      <Link className="btn btn-primary" to="/register">
                        {t('manifesto.cta.createAccount')}
                      </Link>
                      <Link className="btn" to="/security">
                        {t('manifesto.cta.security')}
                      </Link>
                    </div>
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
