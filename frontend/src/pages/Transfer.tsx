import { useEffect, useMemo, useState } from 'react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

function parseStrictCents(value: string): number | null {
  const v = value.trim()
  if (!/^\d+(\.\d{2})$/.test(v)) return null
  const [whole, frac] = v.split('.')
  const cents = Number(whole) * 100 + Number(frac)
  if (!Number.isFinite(cents) || cents <= 0) return null
  return cents
}

export function Transfer() {
  const auth = useAuth()
  const { t } = useI18n()
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [toEmail, setToEmail] = useState('')
  const [amountTrv, setAmountTrv] = useState('10.00')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const totals = useMemo(() => {
    const usd = wallet?.usdCents ?? 0
    const trv = wallet?.trvCents ?? 0
    return { usd, trv }
  }, [wallet])

  const preview = useMemo(() => {
    const cents = parseStrictCents(amountTrv)
    if (cents == null) return { feeCents: null as number | null, totalCents: null as number | null }
    const fee = Math.floor(cents / 100)
    return { feeCents: fee, totalCents: cents + fee }
  }, [amountTrv])

  async function loadWallet() {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getWallet(token)
      setWallet(data)
    } catch (err: any) {
      setError(err?.message || t('errors.loadBalance'))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadWallet()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.transferTrv(token, toEmail, amountTrv)
      setWallet({ usdCents: data.usdCents, trvCents: data.trvCents })
      setAmountTrv('')
    } catch (err: any) {
      setError(err?.message || t('errors.transfer'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid">
      <div className="col-12">
        <h1 className="title">{t('transfer.title')}</h1>
        <div className="subtitle">{t('transfer.subtitle')}</div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div className="muted">{t('dashboard.trvBalance')}</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
                {formatUsd(totals.trv)} TRV
              </div>
            </div>
            <div className="pill pill-accent">{t('labels.available')}</div>
          </div>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <h3 style={{ margin: 0 }}>{t('transfer.title')}</h3>
          <div className="muted" style={{ marginTop: 6 }}>
            {preview.feeCents != null && preview.totalCents != null
              ? t('transfer.feeLine', { fee: formatUsd(preview.feeCents), total: formatUsd(preview.totalCents) })
              : t('transfer.feeLine', { fee: '--', total: '--' })}
          </div>

          <form className="list" onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">{t('transfer.toEmail')}</div>
              <input className="input" value={toEmail} onChange={(e) => setToEmail(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">{t('transfer.amountTrv')}</div>
              <input className="input mono" value={amountTrv} onChange={(e) => setAmountTrv(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={busy} type="submit">
              {t('transfer.submit')}
            </button>
          </form>
        </div>
      </div>

      <div className="col-12">
        {error ? <div className="error">{error}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" disabled={busy} onClick={loadWallet}>
            {busy ? t('actions.updating') : t('actions.updateBalance')}
          </button>
        </div>
      </div>
    </div>
  )
}
