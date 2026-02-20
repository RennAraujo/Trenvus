import { useEffect, useRef, useState } from 'react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
  </svg>
)

const DollarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const ScanLineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="4" x2="20" y1="12" y2="12"/>
  </svg>
)

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
)

// Sample QR codes for payment demo
const DEMO_PAYMENT_QRS = [
  {
    id: 'pay-1',
    payload: 'eyJ0eXBlIjoiSU5WT0lDRSIsInFyQ29kZUlkIjoicGF5LTEiLCJyZWNpcGllbnRJZCI6MiwicmVjaXBpZW50RW1haWwiOiJ1c2VyMkB0ZXN0LmNvbSIsInJlY2lwaWVudE5pY2tuYW1lIjoidGVzdGUyIiwiYW1vdW50IjoiMjUuMDAiLCJjdXJyZW5jeSI6IlVTRCIsImRlc2NyaXB0aW9uIjoiQ29mZmVlIGFuZCBDYWtlIiwidGltZXN0YW1wIjoxNzA4NDUxMjAwMDAwfQ==',
    amount: '25.00',
    currency: 'USD',
    recipient: 'user2@test.com',
    nickname: 'teste2',
    description: 'Coffee and Cake'
  },
  {
    id: 'pay-2',
    payload: 'eyJ0eXBlIjoiSU5WT0lDRSIsInFyQ29kZUlkIjoicGF5LTIiLCJyZWNpcGllbnRJZCI6MywicmVjaXBpZW50RW1haWwiOiJ1c2VyM0B0ZXN0LmNvbSIsInJlY2lwaWVudE5pY2tuYW1lIjoidGVzdGUzIiwiYW1vdW50IjoiMTAwLjAwIiwiY3VycmVuY3kiOiJUUlYiLCJkZXNjcmlwdGlvbiI6Ikdyb2NlcmllcyIsInRpbWVzdGFtcCI6MTcwODQ1MTIwMDAwMH0=',
    amount: '100.00',
    currency: 'TRV',
    recipient: 'user3@test.com',
    nickname: 'teste3',
    description: 'Groceries'
  },
  {
    id: 'pay-3',
    payload: 'eyJ0eXBlIjoiSU5WT0lDRSIsInFyQ29kZUlkIjoicGF5LTMiLCJyZWNpcGllbnRJZCI6MiwicmVjaXBpZW50RW1haWwiOiJ1c2VyMkB0ZXN0LmNvbSIsInJlY2lwaWVudE5pY2tuYW1lIjoidGVzdGUyIiwiYW1vdW50IjoiNTAuMDAiLCJjdXJyZW5jeSI6IlVTRCIsImRlc2NyaXB0aW9uIjoiRGlubmVyIiwidGltZXN0YW1wIjoxNzA4NDUxMjAwMDAwfQ==',
    amount: '50.00',
    currency: 'USD',
    recipient: 'user2@test.com',
    nickname: 'teste2',
    description: 'Dinner'
  }
]

export function InvoicesSend() {
  const auth = useAuth()
  const { t } = useI18n()
  
  const [amount, setAmount] = useState('50.00')
  const [currency, setCurrency] = useState<'USD' | 'TRV'>('USD')
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [detectedQr, setDetectedQr] = useState<typeof DEMO_PAYMENT_QRS[0] | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; wallet?: WalletResponse } | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function loadWallet() {
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getWallet(token)
      setWallet(data)
    } catch (err) {
      console.error('Failed to load wallet', err)
    }
  }

  useEffect(() => {
    loadWallet()
  }, [result])

  function startScanning() {
    setError(null)
    setScanning(true)
    setScanProgress(0)
    setDetectedQr(null)
    setResult(null)

    // Simulate scanning progress
    let progress = 0
    scanIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        // Find a QR code matching the selected currency, or random
        const matchingQrs = DEMO_PAYMENT_QRS.filter(qr => qr.currency === currency)
        const qrPool = matchingQrs.length > 0 ? matchingQrs : DEMO_PAYMENT_QRS
        const randomQr = qrPool[Math.floor(Math.random() * qrPool.length)]
        setDetectedQr(randomQr)
        setScanning(false)
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current)
        }
      }
      setScanProgress(progress)
    }, 200)
  }

  function stopScanning() {
    setScanning(false)
    setScanProgress(0)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
  }

  async function processPayment() {
    if (!detectedQr) return
    
    // Validate amount matches
    if (detectedQr.amount !== amount || detectedQr.currency !== currency) {
      setError(`QR code amount (${detectedQr.amount} ${detectedQr.currency}) doesn't match your selection (${amount} ${currency})`)
      return
    }

    setProcessing(true)
    try {
      const token = await auth.getValidAccessToken()
      const result = await api.payInvoice(token, detectedQr.payload, detectedQr.amount, detectedQr.currency)
      setResult({
        success: true,
        message: `Successfully paid ${detectedQr.amount} ${detectedQr.currency} to ${detectedQr.recipient}`,
        wallet: result
      })
      setDetectedQr(null)
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || 'Payment failed'
      })
    } finally {
      setProcessing(false)
    }
  }

  function cancelPayment() {
    setDetectedQr(null)
    setResult(null)
    setError(null)
  }

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('invoices.send.title')}</h1>
          <p className="page-subtitle">Scan QR codes to make instant payments</p>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">USD Balance</div>
          <div className="stat-value tabular-nums">{wallet ? formatUsd(wallet.usdCents) : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">TRV Balance</div>
          <div className="stat-value tabular-nums">{wallet ? formatUsd(wallet.trvCents) : '—'}</div>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="card" style={{ marginBottom: 24 }}>
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
              <DollarIcon />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Payment Details</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Configure amount and currency</p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: 20 }}>
            <div className="field">
              <label className="field-label">Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <DollarIcon />
                </span>
                <input 
                  className="input font-mono" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  inputMode="decimal"
                  placeholder="0.00"
                  style={{ paddingLeft: 44, fontSize: 18 }}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Currency</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-button ${currency === 'USD' ? 'active' : ''}`}
                  onClick={() => setCurrency('USD')}
                >
                  USD
                </button>
                <button
                  type="button"
                  className={`toggle-button ${currency === 'TRV' ? 'active' : ''}`}
                  onClick={() => setCurrency('TRV')}
                >
                  TRV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: 'var(--color-success-alpha-10)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CameraIcon />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>QR Scanner</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Scan to pay {amount} {currency}
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Scanner Viewport */}
          <div style={{ 
            position: 'relative',
            width: '100%',
            maxWidth: 400,
            height: 300,
            margin: '0 auto 24px',
            background: 'var(--bg-subtle)',
            borderRadius: 16,
            border: '2px solid var(--border-default)',
            overflow: 'hidden'
          }}>
            {scanning ? (
              <>
                {/* Scanning Animation */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 0%, rgba(168,85,247,0.1) 50%, transparent 100%)',
                  animation: 'scan 2s linear infinite'
                }} />
                <style>{`
                  @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                  }
                `}</style>
                
                {/* Corner Markers */}
                <div style={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderTop: '3px solid var(--color-primary)', borderLeft: '3px solid var(--color-primary)' }} />
                <div style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderTop: '3px solid var(--color-primary)', borderRight: '3px solid var(--color-primary)' }} />
                <div style={{ position: 'absolute', bottom: 20, left: 20, width: 40, height: 40, borderBottom: '3px solid var(--color-primary)', borderLeft: '3px solid var(--color-primary)' }} />
                <div style={{ position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, borderBottom: '3px solid var(--color-primary)', borderRight: '3px solid var(--color-primary)' }} />

                {/* Progress */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: 'var(--bg-elevated)'
                }}>
                  <div style={{
                    width: `${scanProgress}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    transition: 'width 0.1s linear'
                  }} />
                </div>

                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <ScanLineIcon />
                  <p className="text-sm text-secondary mt-2">Scanning for {amount} {currency}...</p>
                </div>
              </>
            ) : detectedQr ? (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                padding: 24
              }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  background: 'var(--color-success-alpha-10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-success)'
                }}>
                  <CheckIcon />
                </div>
                <p className="text-sm text-secondary">QR Code Detected!</p>
              </div>
            ) : (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12
              }}>
                <CameraIcon />
                <p className="text-sm text-muted">Click Start to scan a QR code</p>
                <p className="text-xs text-muted">Looking for: {amount} {currency}</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!scanning && !detectedQr && !result && (
              <button className="btn btn-primary btn-lg" onClick={startScanning}>
                <CameraIcon />
                Start Scanner
              </button>
            )}
            
            {scanning && (
              <button className="btn btn-danger" onClick={stopScanning}>
                <XIcon />
                Cancel
              </button>
            )}

            {detectedQr && (
              <>
                <button 
                  className="btn btn-success btn-lg" 
                  onClick={processPayment}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>
                      <SendIcon />
                      Confirm Payment
                    </>
                  )}
                </button>
                <button className="btn btn-secondary" onClick={cancelPayment} disabled={processing}>
                  <XIcon />
                  Cancel
                </button>
              </>
            )}

            {result && (
              <button className="btn btn-primary" onClick={() => { setResult(null); startScanning(); }}>
                <CameraIcon />
                Scan Another
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detected QR Info */}
      {detectedQr && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--color-primary)', boxShadow: 'var(--shadow-glow-sm)' }}>
          <div className="card-body">
            <div className="text-xs font-semibold text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 12 }}>
              Payment Details
            </div>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="sm:grid-cols-1">
                <div>
                  <div className="text-xs text-tertiary mb-2">Amount</div>
                  <div className="font-mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {detectedQr.amount} {detectedQr.currency}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-tertiary mb-2">Recipient</div>
                  <div className="font-mono text-sm">{detectedQr.recipient}</div>
                  {detectedQr.nickname && (
                    <div className="text-xs text-muted">@{detectedQr.nickname}</div>
                  )}
                </div>
              </div>
              
              {detectedQr.description && (
                <div>
                  <div className="text-xs text-tertiary mb-2">Description</div>
                  <div className="text-sm">{detectedQr.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`card ${result.success ? 'alert-success' : 'alert-error'}`} style={{ 
          background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
        }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 24, 
                background: result.success ? 'var(--color-success-alpha-10)' : 'var(--color-danger-alpha-10)',
                color: result.success ? 'var(--color-success)' : 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {result.success ? <CheckIcon /> : <XIcon />}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {result.success ? 'Payment Successful!' : 'Payment Failed'}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {result.message}
                </p>
              </div>
            </div>

            {result.success && result.wallet && (
              <div style={{ 
                marginTop: 20, 
                padding: 16, 
                background: 'var(--bg-elevated)', 
                borderRadius: 12,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16
              }}>
                <div>
                  <div className="text-xs text-tertiary">Updated USD Balance</div>
                  <div className="font-mono font-semibold">{formatUsd(result.wallet.usdCents)} USD</div>
                </div>
                <div>
                  <div className="text-xs text-tertiary">Updated TRV Balance</div>
                  <div className="font-mono font-semibold">{formatUsd(result.wallet.trvCents)} TRV</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Demo Info */}
      <div className="card" style={{ background: 'var(--bg-elevated)' }}>
        <div className="card-body">
          <div className="text-xs font-semibold text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 12 }}>
            Available Demo Payments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_PAYMENT_QRS.map((qr) => (
              <div key={qr.id} style={{ 
                padding: 12, 
                background: 'var(--bg-subtle)', 
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div className="font-mono font-semibold">{qr.amount} {qr.currency}</div>
                  <div className="text-xs text-muted">{qr.description} • {qr.recipient}</div>
                </div>
                <span className={`badge ${qr.currency === 'USD' ? 'badge-primary' : 'badge-secondary'}`}>
                  {qr.currency}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            Set the amount and currency above, then click "Start Scanner" to find a matching QR code
          </p>
        </div>
      </div>
    </div>
  )
}
