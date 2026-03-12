import { useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { LanguageSwitcher, useI18n } from '../i18n'
import brandLogo from '../assets/brand-mark.png'
import { buildE164Phone, digitsOnly, getPhoneCountryOptions } from '../phone'
import type { CountryCode } from 'libphonenumber-js'

// Icons
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

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

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

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

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" x2="23" y1="1" y2="23"/>
  </svg>
)

const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)

const UserCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><line x1="8" x2="8" y1="11" y2="11"/><line x1="12" x2="12" y1="11" y2="11"/><line x1="16" x2="16" y1="11" y2="11"/>
  </svg>
)

type AccountType = 'individual' | 'business'

function formatCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function formatSSN(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

function formatEIN(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 9)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}-${d.slice(2)}`
}

function checkPassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    special: /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(pw),
  }
}

export function Register() {
  const auth = useAuth()
  const { t } = useI18n()
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const locale =
    (typeof window !== 'undefined' ? window.localStorage.getItem('exchange.locale') : null) ||
    (typeof navigator !== 'undefined' ? navigator.language : 'en')
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(locale === 'pt-BR' ? 'BR' : 'US')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('individual')
  const [document, setDocument] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const phoneOptions = useMemo(() => getPhoneCountryOptions(locale), [locale])

  const docCountry = phoneCountry === 'BR' ? 'BR' : phoneCountry === 'US' ? 'US' : null

  type DocInfo = {
    label: string
    placeholder: string
    format: (v: string) => string
    maxDigits: number
    key: string
  }

  const docInfo = useMemo<DocInfo | null>(() => {
    if (docCountry === 'BR') {
      return accountType === 'individual'
        ? { label: t('register.document.cpf'), placeholder: '000.000.000-00', format: formatCPF, maxDigits: 11, key: 'cpf' }
        : { label: t('register.document.cnpj'), placeholder: '00.000.000/0000-00', format: formatCNPJ, maxDigits: 14, key: 'cnpj' }
    }
    if (docCountry === 'US') {
      return accountType === 'individual'
        ? { label: t('register.document.itin'), placeholder: '000-00-0000', format: formatSSN, maxDigits: 9, key: 'itin' }
        : { label: t('register.document.ein'), placeholder: '00-0000000', format: formatEIN, maxDigits: 9, key: 'ein' }
    }
    return null
  }, [docCountry, accountType, t])

  const pwCheck = useMemo(() => checkPassword(password), [password])
  const pwValid = pwCheck.length && pwCheck.upper && pwCheck.lower && pwCheck.special

  function handleDocumentChange(value: string) {
    if (docInfo) {
      setDocument(docInfo.format(value))
    }
  }

  function handlePhoneCountryChange(country: CountryCode) {
    setPhoneCountry(country)
    setDocument('')
  }

  function handleAccountTypeChange(type: AccountType) {
    setAccountType(type)
    setDocument('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!pwValid) {
      setError(t('errors.passwordWeak'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'))
      return
    }

    setBusy(true)
    try {
      const phone = buildE164Phone(phoneCountry, phoneNumber)
      await auth.register(email, password, nickname, phone)
      setRegisteredEmail(email)
    } catch (err: any) {
      const errorCode = err?.message || 'REGISTER_FAILED'
      const errorTranslations: Record<string, string> = {
        'EMAIL_ALREADY_REGISTERED': t('errors.register'),
        'NICKNAME_TAKEN': t('errors.nicknameTaken'),
        'REGISTER_FAILED': t('errors.registerFailed'),
        'Failed to process registration': t('errors.registerFailed'),
      }
      setError(errorTranslations[errorCode] || t('errors.registerFailed'))
    } finally {
      setBusy(false)
    }
  }

  const segmentBase: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 12px',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.15s ease',
  }

  if (registeredEmail) {
    return (
      <div className="auth-container">
        <header className="topbar">
          <div className="container topbar-inner">
            <div className="topbar-left">
              <Link to="/" className="brand">
                <img className="brand-logo" src={brandLogo} alt="TRENVUS" />
              </Link>
              <LanguageSwitcher />
            </div>
          </div>
        </header>
        <main className="auth-main">
          <div className="card auth-card animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 30px rgba(34, 197, 94, 0.3)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="auth-title">{t('register.success.title')}</h1>
            <p className="auth-subtitle" style={{ marginBottom: 24 }}>
              {t('register.success.subtitle')}
            </p>
            <div style={{
              background: 'var(--bg-input, rgba(255,255,255,0.05))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 28,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{registeredEmail}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
              {t('register.success.hint')}
            </p>
            <Link to="/login" className="btn btn-primary btn-lg">
              {t('actions.login')}
            </Link>
          </div>
        </main>
      </div>
    )
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
          <Link className="btn btn-secondary btn-sm" to="/login">
            {t('actions.login')}
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

            {/* Account type selector */}
            <div className="field">
              <label className="field-label">{t('register.accountType')}</label>
              <div style={{
                display: 'flex',
                gap: 4,
                padding: 4,
                background: 'var(--bg-input, rgba(255,255,255,0.05))',
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
              }}>
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange('individual')}
                  style={{
                    ...segmentBase,
                    background: accountType === 'individual'
                      ? 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))'
                      : 'transparent',
                    color: accountType === 'individual' ? 'white' : 'var(--text-muted)',
                    boxShadow: accountType === 'individual' ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none',
                  }}
                >
                  <UserCircleIcon />
                  {t('register.individual')}
                </button>
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange('business')}
                  style={{
                    ...segmentBase,
                    background: accountType === 'business'
                      ? 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))'
                      : 'transparent',
                    color: accountType === 'business' ? 'white' : 'var(--text-muted)',
                    boxShadow: accountType === 'business' ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none',
                  }}
                >
                  <BuildingIcon />
                  {t('register.business')}
                </button>
              </div>
            </div>

            {/* Nickname */}
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

            {/* Email */}
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

            {/* Phone */}
            <div className="field">
              <label className="field-label">{t('labels.phone')}</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <select
                  className="input"
                  value={phoneCountry}
                  onChange={(e) => handlePhoneCountryChange(e.target.value as CountryCode)}
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

            {/* Document field (CPF / CNPJ / SSN / EIN) */}
            {docInfo && (
              <div className="field">
                <label className="field-label">{docInfo.label}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <DocumentIcon />
                  </span>
                  <input
                    key={docInfo.key}
                    className="input"
                    value={document}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    placeholder={docInfo.placeholder}
                    inputMode="numeric"
                    style={{ paddingLeft: 44 }}
                    required
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="field">
              <label className="field-label">{t('labels.password')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <LockIcon />
                </span>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 44, paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', padding: 2,
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {/* Password requirements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginTop: 8 }}>
                {[
                  { ok: pwCheck.length, label: t('register.password.req.length') },
                  { ok: pwCheck.upper,  label: t('register.password.req.upper') },
                  { ok: pwCheck.lower,  label: t('register.password.req.lower') },
                  { ok: pwCheck.special, label: t('register.password.req.special') },
                ].map(({ ok, label }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                      color: ok ? 'var(--color-success, #22c55e)' : 'var(--text-muted)',
                      transition: 'color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{ok ? '✓' : '○'}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="field">
              <label className="field-label">{t('labels.confirmPassword')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <LockIcon />
                </span>
                <input
                  className="input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    paddingLeft: 44, paddingRight: 44,
                    borderColor: confirmPassword && confirmPassword !== password
                      ? 'var(--color-error, #ef4444)'
                      : undefined,
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', padding: 2,
                  }}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p style={{ marginTop: 4, fontSize: 12, color: 'var(--color-error, #ef4444)' }}>
                  {t('errors.passwordMismatch')}
                </p>
              )}
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
