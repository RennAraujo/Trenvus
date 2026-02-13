import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { LanguageSwitcher, useI18n } from '../i18n'
import brandLogo from '../assets/brand-mark.png'

export function Register() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showTestAccounts, setShowTestAccounts] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await auth.register(email, password, nickname, phone)
      navigate('/app', { replace: true })
    } catch (err: any) {
      setError(err?.message || t('errors.register'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/" className="brand">
              <img className="brand-logo" src={brandLogo} alt="TRENVUS" />
            </Link>
            <LanguageSwitcher />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="btn" to="/login">
              {t('actions.login')}
            </Link>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="grid">
            <div className="col-6 card" style={{ margin: '0 auto', maxWidth: 560, gridColumn: 'span 12' as any }}>
              <div className="card-inner">
                <h2 style={{ margin: 0 }}>{t('register.title')}</h2>
                <p className="muted" style={{ marginTop: 6 }}>
                  {t('register.subtitle')}
                </p>

                <form onSubmit={onSubmit} className="list" style={{ marginTop: 14 }}>
                  <div className="field">
                    <div className="label">{t('labels.email')}</div>
                    <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="field">
                    <div className="label">{t('labels.nickname')}</div>
                    <input className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                  </div>
                  <div className="field">
                    <div className="label">{t('labels.phone')}</div>
                    <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
                  </div>
                  <div className="field">
                    <div className="label">{t('labels.password')}</div>
                    <input
                      className="input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error ? <div className="error">{error}</div> : null}
                  <button className="btn btn-primary" disabled={busy} type="submit">
                    {busy ? t('register.loading') : t('actions.register')}
                  </button>
                </form>

                <div className="muted" style={{ marginTop: 14 }}>
                  {t('register.haveAccount')}{' '}
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <Link to="/login" className="pill pill-accent">
                      {t('actions.login')}
                    </Link>
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as any }}>
                      <button
                        type="button"
                        className="pill"
                        disabled={busy}
                        aria-expanded={showTestAccounts}
                        aria-haspopup="menu"
                        onClick={() => setShowTestAccounts((v) => !v)}
                      >
                        {t('actions.testAccount')}
                      </button>
                      {showTestAccounts ? (
                        <span role="menu" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                          <Link
                            to="/login?test=1"
                            className="pill"
                            aria-disabled={busy}
                            onClick={() => setShowTestAccounts(false)}
                          >
                            {t('actions.testAccountN', { n: 1 })}
                          </Link>
                          <Link
                            to="/login?test=2"
                            className="pill"
                            aria-disabled={busy}
                            onClick={() => setShowTestAccounts(false)}
                          >
                            {t('actions.testAccountN', { n: 2 })}
                          </Link>
                          <Link
                            to="/login?test=3"
                            className="pill"
                            aria-disabled={busy}
                            onClick={() => setShowTestAccounts(false)}
                          >
                            {t('actions.testAccountN', { n: 3 })}
                          </Link>
                        </span>
                      ) : null}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
