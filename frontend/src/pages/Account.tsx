import { useEffect, useMemo, useState } from 'react'
import { api, type MeResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { buildE164Phone, digitsOnly, getPhoneCountryOptions, splitE164Phone } from '../phone'
import type { CountryCode } from 'libphonenumber-js'

// Icons
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
)

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)

export function Account() {
  const auth = useAuth()
  const { t } = useI18n()

  const [me, setMe] = useState<MeResponse | null>(null)
  const [nickname, setNickname] = useState('')
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('BR')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canSaveNickname = useMemo(() => {
    const v = nickname.trim()
    if (!v) return false
    return /^[A-Za-z0-9._-]{3,20}$/.test(v)
  }, [nickname])
  const canSavePhone = useMemo(() => digitsOnly(phoneNumber).length > 0, [phoneNumber])
  const canChangePassword = useMemo(() => {
    if (!currentPassword) return false
    if (!newPassword || newPassword.length < 4) return false
    if (!confirmPassword) return false
    return true
  }, [confirmPassword, currentPassword, newPassword])

  const locale = useMemo(() => {
    return (
      (typeof window !== 'undefined' ? window.localStorage.getItem('exchange.locale') : null) ||
      (typeof navigator !== 'undefined' ? navigator.language : 'en')
    )
  }, [])

  const defaultPhoneCountry = useMemo<CountryCode>(() => (locale === 'pt-BR' ? 'BR' : 'US'), [locale])
  const phoneOptions = useMemo(() => getPhoneCountryOptions(locale), [locale])

  async function load() {
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getMe(token)
      setMe(data)
      setNickname(data.nickname || '')
      const parts = splitE164Phone(data.phone, defaultPhoneCountry)
      setPhoneCountry(parts.iso2)
      setPhoneNumber(parts.national)
    } catch (err: any) {
      setError(err?.message || t('errors.loadAccount'))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onSaveNickname(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!canSaveNickname) return
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.updateMyNickname(token, nickname.trim())
      setMe(data)
      setNickname(data.nickname || '')
      setSuccess(t('account.nickname.saved'))
    } catch (err: any) {
      setError(err?.message || t('errors.save'))
    } finally {
      setBusy(false)
    }
  }

  async function onSavePhone(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const phone = buildE164Phone(phoneCountry, phoneNumber)
      const data = await api.updateMyPhone(token, phone)
      setMe(data)
      const parts = splitE164Phone(data.phone, defaultPhoneCountry)
      setPhoneCountry(parts.iso2)
      setPhoneNumber(parts.national)
      setSuccess(t('account.phone.saved'))
    } catch (err: any) {
      setError(err?.message || t('errors.save'))
    } finally {
      setBusy(false)
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (newPassword !== confirmPassword) {
      setError(t('account.password.mismatch'))
      return
    }
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      await api.changeMyPassword(token, currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(t('account.password.changed'))
    } catch (err: any) {
      setError(err?.message || t('errors.save'))
    } finally {
      setBusy(false)
    }
  }

  async function onUploadAvatar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const file = avatarFile
    if (!file) return
    if (file.size > 1_000_000) {
      setError(t('account.avatar.tooLarge'))
      return
    }
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.uploadMyAvatar(token, file)
      setMe(data)
      setAvatarFile(null)
      setSuccess(t('account.avatar.saved'))
    } catch (err: any) {
      setError(err?.message || t('errors.save'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">{t('account.title')}</h1>
            <p className="page-subtitle">{t('account.subtitle')}</p>
          </div>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={load} 
            disabled={busy}
            title="Refresh"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: 24 }}>
        {/* Profile Card */}
        <div className="card" style={{ gridColumn: 'span 2' as any }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'var(--color-primary-alpha-10)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserIcon />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Profile Information</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Your personal details</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ textAlign: 'center' }}>
                <div 
                  style={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: 50, 
                    background: 'var(--bg-subtle)',
                    border: '2px solid var(--border-default)',
                    overflow: 'hidden',
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {me?.avatarDataUrl ? (
                    <img src={me.avatarDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <UserIcon />
                  )}
                </div>
                <form onSubmit={onUploadAvatar} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    <CameraIcon />
                    Change Photo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(ev) => setAvatarFile(ev.target.files?.[0] || null)}
                      disabled={busy}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {avatarFile && (
                    <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
                      <SaveIcon />
                      Save
                    </button>
                  )}
                </form>
                <p className="text-xs text-muted" style={{ marginTop: 8 }}>Max 1MB (PNG, JPG, WebP, GIF)</p>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'grid', gap: 20 }}>
                  <div>
                    <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 4 }}>Email</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MailIcon />
                      <span className="font-mono" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                        {me?.email || auth.userEmail || '—'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 4 }}>Nickname</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 16, display: 'inline-block' }}><UserIcon /></span>
                      <span className="font-mono" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                        {me?.nickname || auth.userNickname || '—'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 4 }}>Role</div>
                    <span className="badge badge-primary">{'USER'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phone Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'var(--color-secondary-alpha-10)',
                color: 'var(--color-secondary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PhoneIcon />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('account.phone.title')}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('account.phone.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={onSavePhone}>
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
                  <input
                    className="input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(digitsOnly(e.target.value))}
                    inputMode="tel"
                    placeholder={t('labels.phoneNumber')}
                  />
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                disabled={busy || !canSavePhone} 
                type="submit"
                style={{ marginTop: 16 }}
              >
                <SaveIcon />
                {t('actions.save')}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'var(--color-primary-alpha-10)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserIcon />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('account.nickname.title')}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('account.nickname.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={onSaveNickname}>
              <div className="field">
                <label className="field-label">{t('labels.nickname')}</label>
                <input
                  className="input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={t('labels.nickname')}
                  disabled={busy}
                />
                <p className="text-xs text-muted" style={{ marginTop: 6 }}>{t('account.nickname.hint')}</p>
              </div>

              <button 
                className="btn btn-primary" 
                disabled={busy || !canSaveNickname} 
                type="submit"
                style={{ marginTop: 16 }}
              >
                <SaveIcon />
                {t('actions.save')}
              </button>
            </form>
          </div>
        </div>

        {/* Password Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LockIcon />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('account.password.title')}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('account.password.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={onChangePassword}>
              <div className="field">
                <label className="field-label">{t('account.password.current')}</label>
                <input
                  className="input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="field" style={{ marginTop: 16 }}>
                <label className="field-label">{t('account.password.new')}</label>
                <input 
                  className="input" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="field" style={{ marginTop: 16 }}>
                <label className="field-label">{t('account.password.confirm')}</label>
                <input
                  className="input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button 
                className="btn btn-primary" 
                disabled={busy || !canChangePassword} 
                type="submit"
                style={{ marginTop: 16 }}
              >
                <SaveIcon />
                {t('actions.save')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
