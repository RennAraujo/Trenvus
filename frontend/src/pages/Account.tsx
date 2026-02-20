import { useEffect, useMemo, useState } from 'react'
import { api, type MeResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { buildE164Phone, digitsOnly, getPhoneCountryOptions, splitE164Phone } from '../phone'
import type { CountryCode } from 'libphonenumber-js'

export function Account() {
  const auth = useAuth()
  const { t } = useI18n()

  const [me, setMe] = useState<MeResponse | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('BR')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    <div className="grid">
      <div className="col-12">
        <h1 className="title">{t('account.title')}</h1>
        <div className="subtitle">{t('account.subtitle')}</div>
      </div>

      <div className="col-12 card">
        <div className="card-inner">
          <div className="list">
            <div>
              <div className="muted">{t('labels.email')}</div>
              <div className="mono" style={{ marginTop: 6 }}>
                {me?.email || auth.userEmail || '—'}
              </div>
            </div>
            <div>
              <div className="muted">{t('labels.nickname')}</div>
              <div className="mono" style={{ marginTop: 6 }}>
                {me?.nickname || auth.userNickname || '—'}
              </div>
            </div>
            <div>
              <div className="muted">{t('account.avatar.title')}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
                <span className="user-avatar" aria-hidden="true" style={{ width: 44, height: 44 }}>
                  {me?.avatarDataUrl ? <img src={me.avatarDataUrl} alt="" /> : null}
                </span>
                <form onSubmit={onUploadAvatar} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(ev) => setAvatarFile(ev.target.files?.[0] || null)}
                    disabled={busy}
                  />
                  <button className="btn btn-primary" type="submit" disabled={busy || !avatarFile}>
                    {t('actions.save')}
                  </button>
                </form>
              </div>
              <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                {t('account.avatar.hint')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <h3 style={{ margin: 0 }}>{t('account.phone.title')}</h3>
          <div className="muted" style={{ marginTop: 6 }}>
            {t('account.phone.subtitle')}
          </div>
          <form className="list" style={{ marginTop: 12 }} onSubmit={onSavePhone}>
            <div className="field">
              <div className="label">{t('labels.phone')}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  className="input"
                  value={phoneCountry}
                  onChange={(e) => setPhoneCountry(e.target.value as CountryCode)}
                  disabled={busy}
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
            <button className="btn btn-primary" disabled={busy || !canSavePhone} type="submit">
              {t('actions.save')}
            </button>
          </form>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <h3 style={{ margin: 0 }}>{t('account.password.title')}</h3>
          <div className="muted" style={{ marginTop: 6 }}>
            {t('account.password.subtitle')}
          </div>
          <form className="list" style={{ marginTop: 12 }} onSubmit={onChangePassword}>
            <div className="field">
              <div className="label">{t('account.password.current')}</div>
              <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <div className="label">{t('account.password.new')}</div>
              <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">{t('account.password.confirm')}</div>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" disabled={busy || !canChangePassword} type="submit">
              {t('actions.save')}
            </button>
          </form>
        </div>
      </div>

      <div className="col-12">
        {error ? <div className="error">{error}</div> : null}
        {success ? <div className="pill pill-accent">{success}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn" disabled={busy} onClick={load} type="button">
            {busy ? t('actions.updating') : t('actions.refresh')}
          </button>
        </div>
      </div>
    </div>
  )
}
