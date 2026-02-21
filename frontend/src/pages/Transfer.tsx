import { useEffect, useMemo, useRef, useState } from 'react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons


const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
)

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
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

export function Transfer() {
  const auth = useAuth()
  const { t } = useI18n()
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [toIdentifier, setToIdentifier] = useState('')
  const [amountDigits, setAmountDigits] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
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
    setSuccess(null)
    if (!amount.plain) {
      setError(t('errors.transfer'))
      return
    }
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.transferTrv(token, toIdentifier, amount.plain)
      setWallet({ usdCents: data.usdCents, trvCents: data.trvCents })
      setAmountDigits('')
      setToIdentifier('')
      setSuccess('Transfer completed successfully!')
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : null
      if (message === 'Não é possível transferir para si mesmo') {
        setError(t('errors.transferSelf'))
      } else if (message?.includes('Destinatário não encontrado') || message?.includes('Recipient not found')) {
        setError(t('errors.transferRecipientNotFound'))
      } else {
        setError(message || t('errors.transfer'))
      }
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
            <h1 className="page-title">{t('transfer.title')}</h1>
            <p className="page-subtitle">{t('transfer.subtitle')}</p>
          </div>
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

      {/* Balance Card */}
      <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: 20, marginBottom: 32 }}>
        <div className="balance-card">
          <div className="balance-card-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="balance-label">TRV Balance</div>
              <span className="badge badge-secondary">Available</span>
            </div>
            <div className="balance-value tabular-nums" style={{ marginTop: 8 }}>
              {formatUsd(totals.trv)}
              <span className="balance-currency">TRV</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Transfer Fee</div>
          <div className="stat-value">0%</div>
          <div className="stat-change stat-change-positive">Free transfers</div>
        </div>
      </div>

      {/* Transfer Form */}
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
              <SendIcon />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Send TRV</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Transfer to any user by email or nickname
              </p>
            </div>
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

          {success && (
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ maxWidth: 480 }}>
            <div className="field">
              <label className="field-label">Recipient (Email or Nickname)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <UserIcon />
                </span>
                <input 
                  className="input" 
                  value={toIdentifier} 
                  onChange={(e) => setToIdentifier(e.target.value)}
                  placeholder="email@example.com or nickname"
                  style={{ paddingLeft: 44 }}
                  required
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 20 }}>
              <label className="field-label">{t('transfer.amountTrv')}</label>
              <div className="input-group">
                <input
                  className="input font-mono"
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
                  placeholder="0,00"
                  style={{ fontSize: 18, padding: '14px 16px' }}
                  required
                />
                <span className="text-sm text-secondary" style={{ fontWeight: 500 }}>TRV</span>
              </div>
              <p className="text-xs text-muted" style={{ marginTop: 4 }}>Minimum: 0,01 TRV</p>
            </div>

            {/* Transfer Preview */}
            {amount.cents !== null && amount.cents > 0n && (
              <div 
                className="text-sm" 
                style={{ 
                  marginTop: 20, 
                  padding: 16, 
                  background: 'var(--bg-subtle)', 
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="text-secondary">You send</span>
                  <span className="font-mono font-semibold">{amount.formatted} TRV</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="text-secondary">Network fee</span>
                  <span className="font-mono text-success">Free</span>
                </div>
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-secondary">Recipient receives</span>
                  <span className="font-mono font-bold text-accent">{amount.formatted} TRV</span>
                </div>
              </div>
            )}
            
            <button 
              className="btn btn-primary btn-lg" 
              disabled={busy} 
              type="submit"
              style={{ marginTop: 24, width: '100%' }}
            >
              {busy ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <SendIcon />
                  {t('transfer.submit')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Info */}
      <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm text-secondary">
          <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> Transfers are instant and irreversible. 
          Make sure the recipient's email or nickname is correct before confirming.
        </p>
      </div>
    </div>
  )
}
