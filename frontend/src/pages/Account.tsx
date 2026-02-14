import { useEffect, useMemo, useState } from 'react'
import { api, type MeResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

export function Account() {
  const auth = useAuth()
  const { t } = useI18n()

  const [me, setMe] = useState<MeResponse | null>(null)
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canSavePhone = useMemo(() => phone.trim().length > 0, [phone])
  const canChangePassword = useMemo(() => {
    if (!currentPassword) return false
    if (!newPassword || newPassword.length < 6) return false
    if (!confirmPassword) return false
    return true
  }, [confirmPassword, currentPassword, newPassword])

  async function load() {
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getMe(token)
      setMe(data)
      setPhone(data.phone || '')
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
      const data = await api.updateMyPhone(token, phone.trim())
      setMe(data)
      setPhone(data.phone || '')
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
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
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
