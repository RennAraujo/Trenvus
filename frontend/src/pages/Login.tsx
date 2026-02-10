import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { LanguageSwitcher, useI18n } from '../i18n'
import brandLogo from '../assets/brand-mark.png'

export function Login() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const testIdRaw = searchParams.get('test')
  const testId = testIdRaw ? Number(testIdRaw) : NaN
  const isTestLogin = Number.isFinite(testId) && testId >= 1 && testId <= 3

  const loginTestAccount = useCallback(async (id: number) => {
    setError(null)
    setBusy(true)
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await auth.loginTestAccount(id)
          navigate('/app', { replace: true })
          return
        } catch (err: any) {
          const status = typeof err?.status === 'number' ? (err.status as number) : null
          const retryable = err?.name === 'NetworkError' || status === 502 || status === 503 || status === 504
          if (attempt < 4 && retryable) {
            await new Promise((r) => setTimeout(r, 600))
            continue
          }
          throw err
        }
      }
    } catch (err: any) {
      setError(err?.message || t('errors.loginTestAccount'))
    } finally {
      setBusy(false)
    }
  }, [auth, navigate, t])

  useEffect(() => {
    if (!isTestLogin) return
    loginTestAccount(testId)
  }, [isTestLogin, loginTestAccount, testId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await auth.login(email, password)
      navigate('/app', { replace: true })
    } catch (err: any) {
      setError(err?.message || t('errors.login'))
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
            <Link className="btn" to="/register">
              {t('actions.register')}
            </Link>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="grid">
            <div className="col-6 card" style={{ margin: '0 auto', maxWidth: 560, gridColumn: 'span 12' as any }}>
              <div className="card-inner">
                <h2 style={{ margin: 0 }}>{t('login.title')}</h2>
                <p className="muted" style={{ marginTop: 6 }}>
                  {t('login.subtitle')}
                </p>

                <form onSubmit={onSubmit} className="list" style={{ marginTop: 14 }}>
                  <div className="field">
                    <div className="label">{t('labels.email')}</div>
                    <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
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
                    {busy ? t('login.loading') : t('actions.login')}
                  </button>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as any }}>
                    <button className="btn" disabled={busy} type="button" onClick={() => loginTestAccount(1)}>
                      {t('actions.loginTestAccountN', { n: 1 })}
                    </button>
                    <button className="btn" disabled={busy} type="button" onClick={() => loginTestAccount(2)}>
                      {t('actions.loginTestAccountN', { n: 2 })}
                    </button>
                    <button className="btn" disabled={busy} type="button" onClick={() => loginTestAccount(3)}>
                      {t('actions.loginTestAccountN', { n: 3 })}
                    </button>
                  </div>
                </form>

                <div className="muted" style={{ marginTop: 14 }}>
                  {t('login.noAccount')}{' '}
                  <Link to="/register" className="pill pill-accent">
                    {t('actions.createNow')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
