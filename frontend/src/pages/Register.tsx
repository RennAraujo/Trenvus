import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { LanguageSwitcher, useI18n } from '../i18n'
import brandLogo from '../assets/brand-mark.png'

// Icons
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
      await auth.register(email, password)
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

const UserPlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/>
  </svg>
)

export function Register() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const locale =
    (typeof window !== 'undefined' ? window.localStorage.getItem('exchange.locale') : null) ||
    (typeof navigator !== 'undefined' ? navigator.language : 'en')
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(locale === 'pt-BR' ? 'BR' : 'US')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const phoneOptions = useMemo(() => getPhoneCountryOptions(locale), [locale])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const phone = buildE164Phone(phoneCountry, phoneNumber)
      await auth.register(email, password, nickname, phone)
      navigate('/app', { replace: true })
    } catch (err: any) {
      setError(err?.message || t('errors.register'))
    } finally {
              borderRadius: 16, 
              background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 30px rgba(124, 58, 237, 0.3)'
            }}>
              <span style={{ color: 'white' }}><UserPlusIcon /></span>
            </div>
            <h1 className="auth-title">{t('register.title')}</h1>
            <p className="auth-subtitle">{t('register.subtitle')}</p>
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
              <label className="field-label">{t('labels.nickname')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <UserIcon />
                </span>
                <input 
                  className="input" 
                  value={nickname} 
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="johndoe"
                  style={{ paddingLeft: 44 }}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t('labels.email')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <MailIcon />
                </span>
                <input 
                  className="input" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ paddingLeft: 44 }}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t('labels.phone')}</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <select
                  className="input"
                  value={phoneCountry}
                  onChange={(e) => setPhoneCountry(e.target.value as CountryCode)}
                  disabled={busy}
                  style={{ width: 100, flexShrink: 0 }}
                >
                  {phoneOptions.map((c) => (
                    <option key={c.iso2} value={c.iso2}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <PhoneIcon />
                  </span>
                  <input
                    className="input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(digitsOnly(e.target.value))}
                    inputMode="tel"
                    placeholder={t('labels.phoneNumber')}
                    style={{ paddingLeft: 44 }}
                  />
                </div>
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
                  minLength={8}
                />
              </div>
              <p className="text-xs text-muted" style={{ marginTop: 4 }}>Must be at least 8 characters</p>
            </div>

            <button 
              className="btn btn-primary btn-lg" 
              disabled={busy} 
              type="submit"
              style={{ marginTop: 8 }}
            >
              {busy ? (
                <span className="animate-pulse">{t('register.loading')}</span>
              ) : (
                <>
                  {t('actions.register')}
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span className="text-secondary">{t('register.haveAccount')}</span>{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
              {t('actions.login')}
            </Link>
          </div>

          {/* Test Accounts */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs text-muted text-center" style={{ marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.08 }}>
              Quick Access
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[1, 2, 3].map((id) => (
                <Link 
                  key={id}
                  to={`/login?test=${id}`}
                  className="btn btn-ghost btn-sm"
                >
                  Test Account {id}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
