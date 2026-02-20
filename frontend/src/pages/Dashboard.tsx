import { useEffect, useMemo, useRef, useState } from 'react'
import { api, createIdempotencyKey, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

type ConvertDirection = 'USD_TO_TRV' | 'TRV_TO_USD'

// Icons
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
)

const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

const ConvertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>
  </svg>
)

const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
  </svg>
)

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

  const formatted = `${groupInt(wholeRaw)},${fracTwo}`
  const plain = `${wholeRaw}.${fracTwo}`
  return { formatted, cents, plain }
}



export function Dashboard() {
  const auth = useAuth()
  const { t } = useI18n()
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [privateMode, setPrivateMode] = useState(false)
  const [depositDigits, setDepositDigits] = useState('1000')
  const [convertDirection, setConvertDirection] = useState<ConvertDirection>('USD_TO_TRV')
  const [convertDigits, setConvertDigits] = useState('1000')
  const [activeTab, setActiveTab] = useState<'deposit' | 'convert'>('deposit')
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
      setError(t('errors.depositMin', { min: '10,00' }))
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

  const totalBalance = totals.usd + totals.trv
  const formattedTotal = privateMode ? '••••••' : formatUsd(totalBalance)

  const currencyValue = formatMoneyDigits(convertDigits).cents
  const displayCents = currencyValue !== null ? currencyValue.toString() : '0'

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">{t('nav.dashboard')}</h1>
            <p className="page-subtitle">{t('dashboard.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`private-toggle ${privateMode ? 'active' : ''}`}
              onClick={() => setPrivateMode(!privateMode)}
              title={privateMode ? 'Show values' : 'Hide values'}
            >
              {privateMode ? <EyeOffIcon /> : <EyeIcon />}
              <span>Private</span>
            </button>
            <button 
              className="btn btn-secondary btn-icon" 
              onClick={loadWallet} 
              disabled={busy}
              title="Refresh"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: 20, marginBottom: 32 }}>
        {/* USD Balance */}
        <div className="balance-card balance-card-accent">
          <div className="balance-card-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="balance-label">USD Balance</div>
              <span className="badge badge-primary">Available</span>
            </div>
            <div className="balance-value tabular-nums" style={{ marginTop: 8 }}>
              {privateMode ? (
                <span className="balance-value-hidden">••••••</span>
              ) : (
                <>
                  {formatUsd(totals.usd)}
                  <span className="balance-currency">USD</span>
                </>
              )}
            </div>
          </div>
          <div className="balance-footer">
            <div style={{ flex: 1 }} />
            <div className="text-xs text-tertiary">1 USD = 1 TRV</div>
          </div>
        </div>

        {/* TRV Balance */}
        <div className="balance-card">
          <div className="balance-card-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="balance-label">TRV Balance</div>
              <span className="badge badge-secondary">Trenvus</span>
            </div>
            <div className="balance-value tabular-nums" style={{ marginTop: 8 }}>
              {privateMode ? (
                <span className="balance-value-hidden">••••••</span>
              ) : (
                <>
                  {formatUsd(totals.trv)}
                  <span className="balance-currency">TRV</span>
                </>
              )}
            </div>
          </div>
          <div className="balance-footer">
            <div style={{ flex: 1 }} />
            <div className="text-xs text-tertiary">Native token</div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 md:grid-cols-2 sm:grid-cols-1" style={{ gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Total Balance</div>
          <div className="stat-value tabular-nums">{formattedTotal}</div>
          <div className="stat-change stat-change-positive">
            <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}><ArrowDownIcon /></span>
            Available
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Exchange Rate</div>
          <div className="stat-value tabular-nums">1.00</div>
          <div className="stat-change stat-change-positive">
            USD/TRV
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Conversion Fee</div>
          <div className="stat-value tabular-nums">1%</div>
          <div className="stat-change stat-change-negative">
            Per transaction
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Network</div>
          <div className="stat-value">Trenvus</div>
          <div className="stat-change stat-change-positive">
            Active
          </div>
        </div>
      </div>

      {/* Action Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap' }}>
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
              {activeTab === 'deposit' ? <WalletIcon /> : <ConvertIcon />}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                {activeTab === 'deposit' ? t('dashboard.deposit.title') : t('dashboard.convert.title')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {activeTab === 'deposit' ? t('dashboard.deposit.help') : t('dashboard.convert.feeLine')}
              </p>
            </div>
          </div>
          
          <div className="toggle-group">
            <button
              className={`toggle-button ${activeTab === 'deposit' ? 'active' : ''}`}
              onClick={() => setActiveTab('deposit')}
            >
              {t('dashboard.deposit.title')}
            </button>
            <button
              className={`toggle-button ${activeTab === 'convert' ? 'active' : ''}`}
              onClick={() => setActiveTab('convert')}
            >
              {t('dashboard.convert.title')}
            </button>
          </div>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {activeTab === 'deposit' ? (
            <form onSubmit={onDeposit} style={{ maxWidth: 400 }}>
              <div className="field">
                <label className="field-label">{t('labels.amountUsd')}</label>
                <div className="input-group">
                  <input
                    className="input font-mono"
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
                    placeholder="0,00"
                    style={{ fontSize: 18, padding: '14px 16px' }}
                  />
                  <span className="text-sm text-secondary" style={{ fontWeight: 500 }}>USD</span>
                </div>
                <p className="text-xs text-muted" style={{ marginTop: 4 }}>Minimum deposit: 10,00 USD</p>
              </div>
              
              <button 
                className="btn btn-primary btn-lg" 
                disabled={busy} 
                type="submit"
                style={{ marginTop: 20, width: '100%' }}
              >
                {busy ? (
                  <>
                    <span className="animate-pulse">Processing...</span>
                  </>
                ) : (
                  <>
                    <WalletIcon />
                    {t('dashboard.deposit.submit')}
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={onConvert} style={{ maxWidth: 480 }}>
              <div style={{ marginBottom: 20 }}>
                <label className="field-label">Conversion Direction</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-button ${convertDirection === 'USD_TO_TRV' ? 'active' : ''}`}
                    onClick={() => setConvertDirection('USD_TO_TRV')}
                    disabled={busy}
                  >
                    {t('dashboard.convert.usdToTrv')}
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${convertDirection === 'TRV_TO_USD' ? 'active' : ''}`}
                    onClick={() => setConvertDirection('TRV_TO_USD')}
                    disabled={busy}
                  >
                    {t('dashboard.convert.trvToUsd')}
                  </button>
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  {t('labels.amountByCurrency', {
                    currency: convertDirection === 'USD_TO_TRV' ? 'USD' : 'TRV',
                  })}
                </label>
                <div className="input-group">
                  <input
                    className="input font-mono"
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
                    placeholder="0,00"
                    style={{ fontSize: 18, padding: '14px 16px' }}
                  />
                  <span className="text-sm text-secondary" style={{ fontWeight: 500 }}>
                    {convertDirection === 'USD_TO_TRV' ? 'USD' : 'TRV'}
                  </span>
                </div>
                
                {/* Conversion Preview */}
                {currencyValue !== null && currencyValue > 0n && (
                  <div 
                    className="text-sm" 
                    style={{ 
                      marginTop: 12, 
                      padding: 12, 
                      background: 'var(--bg-subtle)', 
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="text-secondary">You send</span>
                      <span className="font-mono font-semibold">
                        {formatMoneyDigits(convertDigits).formatted} {convertDirection === 'USD_TO_TRV' ? 'USD' : 'TRV'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="text-secondary">Fee (1%)</span>
                      <span className="font-mono text-danger">
                        -{formatMoneyDigits((Number(displayCents) / 100).toString().split('.')[0]).formatted} {convertDirection === 'USD_TO_TRV' ? 'USD' : 'TRV'}
                      </span>
                    </div>
                    <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-secondary">You receive</span>
                      <span className="font-mono font-bold text-accent">
                        {formatMoneyDigits((Number(displayCents) * 0.99).toString().split('.')[0]).formatted} {convertDirection === 'USD_TO_TRV' ? 'TRV' : 'USD'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                className="btn btn-primary btn-lg" 
                disabled={busy} 
                type="submit"
                style={{ marginTop: 20, width: '100%' }}
              >
                {busy ? (
                  <>
                    <span className="animate-pulse">Processing...</span>
                  </>
                ) : (
                  <>
                    <ConvertIcon />
                    {t('dashboard.convert.submit')}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
