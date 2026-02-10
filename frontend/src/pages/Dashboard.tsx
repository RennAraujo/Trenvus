import { useEffect, useMemo, useRef, useState } from 'react'
import { api, createIdempotencyKey, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

type ConvertDirection = 'USD_TO_TRV' | 'TRV_TO_USD'

function groupInt(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatMoneyDigits(digits: string): { formatted: string; cents: bigint | null; plain: string | null } {
  const cleaned = digits.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (!cleaned) return { formatted: '', cents: null, plain: null }

  let cents: bigint
  try {
    cents = BigInt(cleaned)
  } catch {
    return { formatted: '', cents: null, plain: null }
  }
  if (cents <= 0n) return { formatted: '', cents: null, plain: null }

  const whole = cents / 100n
  const frac = cents % 100n
  const wholeRaw = whole.toString()
  const fracTwo = frac.toString().padStart(2, '0')

  const formatted = `${groupInt(wholeRaw)}.${fracTwo}`
  const plain = `${wholeRaw}.${fracTwo}`
  return { formatted, cents, plain }
}

export function Dashboard() {
  const auth = useAuth()
  const { t } = useI18n()
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [depositDigits, setDepositDigits] = useState('1000')
  const [convertDirection, setConvertDirection] = useState<ConvertDirection>('USD_TO_TRV')
  const [convertDigits, setConvertDigits] = useState('1000')
  const depositInputRef = useRef<HTMLInputElement | null>(null)
  const convertInputRef = useRef<HTMLInputElement | null>(null)

  const totals = useMemo(() => {
    const usd = wallet?.usdCents ?? 0
    const trv = wallet?.trvCents ?? 0
    return { usd, trv }
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
    const parsed = formatMoneyDigits(depositDigits)
    if (!parsed.plain || parsed.cents == null || parsed.cents < 1000n) {
      setError(t('errors.depositMin', { min: '10.00' }))
      return
    }
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.depositUsd(token, parsed.plain)
      setWallet({ usdCents: data.usdCents, trvCents: data.trvCents })
      setDepositDigits('')
    } catch (err: any) {
      setError(err?.message || t('errors.deposit'))
    } finally {
      setBusy(false)
    }
  }

  async function onConvert(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = formatMoneyDigits(convertDigits)
    if (!parsed.plain) {
      setError(t('errors.convert'))
      return
    }
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const idempotencyKey = createIdempotencyKey()
      const data =
        convertDirection === 'USD_TO_TRV'
          ? await api.convertUsdToTrv(token, parsed.plain, idempotencyKey)
          : await api.convertTrvToUsd(token, parsed.plain, idempotencyKey)
      setWallet({ usdCents: data.usdCents, trvCents: data.trvCents })
      setConvertDigits('')
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
              <div className="muted">{t('dashboard.trvBalance')}</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
                {formatUsd(totals.trv)} TRV
              </div>
            </div>
            <div className="pill">{t('dashboard.trvRate')}</div>
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
              <input
                className="input mono"
                value={formatMoneyDigits(depositDigits).formatted}
                ref={depositInputRef}
                onFocus={() => {
                  const el = depositInputRef.current
                  if (!el) return
                  const len = el.value.length
                  el.setSelectionRange(len, len)
                }}
                onClick={() => {
                  const el = depositInputRef.current
                  if (!el) return
                  const len = el.value.length
                  el.setSelectionRange(len, len)
                }}
                onChange={(e) => {
                  const nextDigits = e.target.value.replace(/\D/g, '')
                  setDepositDigits(nextDigits)
                  requestAnimationFrame(() => {
                    const el = depositInputRef.current
                    if (!el) return
                    const len = el.value.length
                    el.setSelectionRange(len, len)
                  })
                }}
                inputMode="numeric"
              />
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
                className={convertDirection === 'USD_TO_TRV' ? 'btn btn-primary' : 'btn'}
                disabled={busy}
                type="button"
                onClick={() => setConvertDirection('USD_TO_TRV')}
              >
                {t('dashboard.convert.usdToTrv')}
              </button>
              <button
                className={convertDirection === 'TRV_TO_USD' ? 'btn btn-primary' : 'btn'}
                disabled={busy}
                type="button"
                onClick={() => setConvertDirection('TRV_TO_USD')}
              >
                {t('dashboard.convert.trvToUsd')}
              </button>
            </div>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            {t('dashboard.convert.feeLine')}
          </div>
          <form className="list" onSubmit={onConvert} style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">
                {t('labels.amountByCurrency', {
                  currency: convertDirection === 'USD_TO_TRV' ? t('labels.usd') : 'TRV',
                })}
              </div>
              <input
                className="input mono"
                value={formatMoneyDigits(convertDigits).formatted}
                ref={convertInputRef}
                onFocus={() => {
                  const el = convertInputRef.current
                  if (!el) return
                  const len = el.value.length
                  el.setSelectionRange(len, len)
                }}
                onClick={() => {
                  const el = convertInputRef.current
                  if (!el) return
                  const len = el.value.length
                  el.setSelectionRange(len, len)
                }}
                onChange={(e) => {
                  const nextDigits = e.target.value.replace(/\D/g, '')
                  setConvertDigits(nextDigits)
                  requestAnimationFrame(() => {
                    const el = convertInputRef.current
                    if (!el) return
                    const len = el.value.length
                    el.setSelectionRange(len, len)
                  })
                }}
                inputMode="numeric"
              />
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
