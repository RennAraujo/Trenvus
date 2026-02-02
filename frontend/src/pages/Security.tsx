import { Link } from 'react-router-dom'
import { LanguageSwitcher, useI18n } from '../i18n'

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
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <LanguageSwitcher />
            <Link to="/" className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <span>TRENVUS</span>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="btn" to="/">
              {t('actions.previous')}
            </Link>
            <Link className="btn btn-primary" to="/register">
              {t('security.cta.createAccount')}
            </Link>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="hero">
            <div>
              <h1 className="title">{t('security.page.title')}</h1>
              <p className="subtitle">{t('security.page.subtitle')}</p>

              <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                <Link className="btn btn-primary" to="/register">
                  {t('security.cta.createAccount')}
                </Link>
                <Link className="btn" to="/login">
                  {t('actions.login')}
                </Link>
              </div>

              <div style={{ marginTop: 22 }} className="grid">
                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill pill-accent">{t('security.card.identity.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('security.card.identity.title')}</h3>
                    <div className="muted">{t('security.card.identity.body')}</div>
                  </div>
                </div>

                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('security.card.passwords.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('security.card.passwords.title')}</h3>
                    <div className="muted">{t('security.card.passwords.body')}</div>
                  </div>
                </div>

                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('security.card.refresh.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('security.card.refresh.title')}</h3>
                    <div className="muted">{t('security.card.refresh.body')}</div>
                  </div>
                </div>

                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('security.card.validation.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('security.card.validation.title')}</h3>
                    <div className="muted">{t('security.card.validation.body')}</div>
                  </div>
                </div>

                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('security.card.balance.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('security.card.balance.title')}</h3>
                    <div className="muted">{t('security.card.balance.body')}</div>
                  </div>
                </div>

                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">{t('security.card.control.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('security.card.control.title')}</h3>
                    <div className="muted">{t('security.card.control.body')}</div>
                  </div>
                </div>

                <div className="col-12 card">
                  <div className="card-inner">
                    <div className="pill">{t('security.tech.pill')}</div>
                    <h3 style={{ margin: '10px 0 6px' }}>{t('security.tech.title')}</h3>
                    <div className="list">
                      {techLines.map((line) => (
                        <div key={line} className="muted">
                          {line}
                        </div>
                      ))}
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
