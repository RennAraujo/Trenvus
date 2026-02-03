import { useEffect, useMemo, useState } from 'react'
import { api, createIdempotencyKey, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

type ConvertDirection = 'USD_TO_VPS' | 'VPS_TO_USD'

export function Dashboard() {
  const auth = useAuth()
  const { t } = useI18n()
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [depositAmount, setDepositAmount] = useState('10.00')
  const [convertDirection, setConvertDirection] = useState<ConvertDirection>('USD_TO_VPS')
  const [convertAmount, setConvertAmount] = useState('10.00')

  const feeCents = 50

  const totals = useMemo(() => {
    const usd = wallet?.usdCents ?? 0
    const vps = wallet?.vpsCents ?? 0
    return { usd, vps }
  }, [wallet])

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

  async function onDeposit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.depositUsd(token, depositAmount)
      setWallet({ usdCents: data.usdCents, vpsCents: data.vpsCents })
      setDepositAmount('')
    } catch (err: any) {
      setError(err?.message || t('errors.deposit'))
    } finally {
      setBusy(false)
    }
  }

  async function onConvert(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const idempotencyKey = createIdempotencyKey()
      const data =
        convertDirection === 'USD_TO_VPS'
          ? await api.convertUsdToVps(token, convertAmount, idempotencyKey)
          : await api.convertVpsToUsd(token, convertAmount, idempotencyKey)
      setWallet({ usdCents: data.usdCents, vpsCents: data.vpsCents })
      setConvertAmount('')
    } catch (err: any) {
      setError(err?.message || t('errors.convert'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid">
      <div className="col-12">
        <h1 className="title">{t('nav.dashboard')}</h1>
        <div className="subtitle">{t('dashboard.subtitle')}</div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div className="muted">{t('dashboard.usdBalance')}</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
                {formatUsd(totals.usd)} USD
              </div>
            </div>
            <div className="pill pill-accent">{t('labels.available')}</div>
          </div>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div className="muted">{t('dashboard.vpsBalance')}</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
                {formatUsd(totals.vps)} VPS
              </div>
            </div>
            <div className="pill">{t('dashboard.vpsRate')}</div>
          </div>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <h3 style={{ margin: 0 }}>{t('dashboard.deposit.title')}</h3>
          <div className="muted" style={{ marginTop: 6 }}>
            {t('dashboard.deposit.help')}
          </div>
          <form className="list" onSubmit={onDeposit} style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">{t('labels.amountUsd')}</div>
              <input className="input mono" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={busy} type="submit">
              {t('dashboard.deposit.submit')}
            </button>
          </form>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0 }}>{t('dashboard.convert.title')}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={convertDirection === 'USD_TO_VPS' ? 'btn btn-primary' : 'btn'}
                disabled={busy}
                type="button"
                onClick={() => setConvertDirection('USD_TO_VPS')}
              >
                {t('dashboard.convert.usdToVps')}
              </button>
              <button
                className={convertDirection === 'VPS_TO_USD' ? 'btn btn-primary' : 'btn'}
                disabled={busy}
                type="button"
                onClick={() => setConvertDirection('VPS_TO_USD')}
              >
                {t('dashboard.convert.vpsToUsd')}
              </button>
            </div>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            {t('dashboard.convert.feeLine', { fee: formatUsd(feeCents) })}
          </div>
          <form className="list" onSubmit={onConvert} style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">
                {t('labels.amountByCurrency', {
                  currency: convertDirection === 'USD_TO_VPS' ? t('labels.usd') : 'VPS',
                })}
              </div>
              <input className="input mono" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={busy} type="submit">
              {t('dashboard.convert.submit')}
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
