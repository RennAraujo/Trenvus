import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { LanguageSwitcher, useI18n } from '../i18n'
import brandLogo from '../assets/brand-mark.png'

// Icons
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
)

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
    console.log(`[Login] Attempting test login for account ${id}`)
    setError(null)
    setBusy(true)
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          console.log(`[Login] Test login attempt ${attempt + 1}/5`)
          await auth.loginTestAccount(id)
          console.log(`[Login] Test login successful, navigating...`)
          navigate('/app', { replace: true })
          return
        } catch (err: any) {
          console.error(`[Login] Test login attempt ${attempt + 1} failed:`, err)
          const status = typeof err?.status === 'number' ? (err.status as number) : null
          const retryable = err?.name === 'NetworkError' || status === 502 || status === 503 || status === 504
          if (attempt < 4 && retryable) {
            console.log(`[Login] Retrying in 600ms...`)
            await new Promise((r) => setTimeout(r, 600))
            continue
          }
          throw err
        }
      }
    } catch (err: any) {
      console.error('[Login] Test login failed:', err)
      const errorMsg = err?.message || t('errors.loginTestAccount')
      setError(`Test Account ${id}: ${errorMsg}`)
    } finally {
      setBusy(false)
    }
  }, [auth, navigate, t])

  const loginAdmin = useCallback(async () => {
    console.log('[Login] Attempting admin login')
    setError(null)
    setBusy(true)
    try {
      await auth.loginAdmin()
      console.log('[Login] Admin login successful, navigating...')
      navigate('/app/admin/users', { replace: true })
    } catch (err: any) {
      console.error('[Login] Admin login failed:', err)
      const status = typeof err?.status === 'number' ? (err.status as number) : null
      if (status === 404) {
        setError('Admin login: ' + t('errors.loginAdminDisabled'))
      } else if (err?.message === 'admin_account_disabled') {
        setError('Admin login: ' + t('errors.adminAccountDisabled'))
      } else if (err?.message === 'admin_login_disabled') {
        setError('Admin login: ' + t('errors.loginAdminDisabled'))
      } else {
        setError('Admin login: ' + (err?.message || t('errors.login')))
      }
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
    <div className="auth-container">
      {/* Topbar */}
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <Link to="/" className="brand">
              <img className="brand-logo" src={brandLogo} alt="TRENVUS" />
            </Link>
            <LanguageSwitcher />
          </div>
          <Link className="btn btn-secondary btn-sm" to="/register">
            {t('actions.register')}
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="auth-main">
        <div className="card auth-card animate-fade-in">
          <div className="auth-header">
            <div style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 16, 
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 30px rgba(168, 85, 247, 0.4)'
            }}>
              <span style={{ color: 'white' }}><ShieldCheckIcon /></span>
            </div>
            <h1 className="auth-title">{t('login.title')}</h1>
            <p className="auth-subtitle">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 24 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="field">
              <label className="field-label">{t('labels.email')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <MailIcon />
                </span>
                <input 
                  className="input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ paddingLeft: 44 }}
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t('labels.password')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <LockIcon />
                </span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 44 }}
                  required
                />
              </div>
            </div>

            <button 
              className="btn btn-primary btn-lg" 
              disabled={busy} 
              type="submit"
              style={{ marginTop: 8 }}
            >
              {busy ? (
                <span className="animate-pulse">{t('login.loading')}</span>
              ) : (
                <>
                  {t('actions.login')}
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span className="text-secondary">{t('login.noAccount')}</span>{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
              {t('actions.createNow')}
            </Link>
          </div>

          {/* Test Accounts */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs text-muted text-center" style={{ marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.08 }}>
              Developer Options
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-sm" disabled={busy} type="button" onClick={loginAdmin}>
                Admin
              </button>
              {[1, 2, 3].map((id) => (
                <button 
                  key={id}
                  className="btn btn-ghost btn-sm" 
                  disabled={busy} 
                  type="button" 
                  onClick={() => loginTestAccount(id)}
                >
                  Test {id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
