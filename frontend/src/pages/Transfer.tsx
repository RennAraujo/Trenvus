import { useEffect, useMemo, useRef, useState } from 'react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

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

export function Transfer() {
  const auth = useAuth()
  const { t } = useI18n()
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [toEmail, setToEmail] = useState('')
  const [amountDigits, setAmountDigits] = useState('1000')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const amountInputRef = useRef<HTMLInputElement | null>(null)

  const totals = useMemo(() => {
    const usd = wallet?.usdCents ?? 0
    const trv = wallet?.trvCents ?? 0
    return { usd, trv }
  }, [wallet])

  const amount = useMemo(() => formatMoneyDigits(amountDigits), [amountDigits])

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
    if (!amount.plain) {
      setError(t('errors.transfer'))
      return
    }
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.transferTrv(token, toEmail, amount.plain)
      setWallet({ usdCents: data.usdCents, trvCents: data.trvCents })
      setAmountDigits('')
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : null
      if (message === 'Não é possível transferir para si mesmo') {
        setError(t('errors.transferSelf'))
      } else {
        setError(message || t('errors.transfer'))
      }
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
            {amount.plain ? t('transfer.totalLine', { total: amount.formatted }) : null}
          </div>

          <form className="list" onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">{t('transfer.toEmail')}</div>
              <input className="input" value={toEmail} onChange={(e) => setToEmail(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">{t('transfer.amountTrv')}</div>
              <input
                className="input mono"
                value={amount.formatted}
                ref={amountInputRef}
                onFocus={() => {
                  const el = amountInputRef.current
                  if (!el) return
                  const len = el.value.length
                  el.setSelectionRange(len, len)
                }}
                onClick={() => {
                  const el = amountInputRef.current
                  if (!el) return
                  const len = el.value.length
                  el.setSelectionRange(len, len)
                }}
                onChange={(e) => {
                  const nextDigits = e.target.value.replace(/\D/g, '')
                  setAmountDigits(nextDigits)
                  requestAnimationFrame(() => {
                    const el = amountInputRef.current
                    if (!el) return
                    const len = el.value.length
                    el.setSelectionRange(len, len)
                  })
                }}
                inputMode="numeric"
              />
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
