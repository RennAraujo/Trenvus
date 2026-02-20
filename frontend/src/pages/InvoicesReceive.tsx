import { useEffect, useRef, useState } from 'react'
// QR Code removed for now - using placeholder
const QRCodePlaceholder = () => (
  <div style={{ 
    width: 200, 
    height: 200, 
    background: 'var(--bg-elevated)', 
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed var(--border-default)'
  }}>
    <span className="text-muted">QR</span>
  </div>
)
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

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


export function InvoicesReceive() {
  const auth = useAuth()
  const { t } = useI18n()
  
  const [amount, setAmount] = useState('50.00')
  const [currency, setCurrency] = useState<'USD' | 'TRV'>('USD')
  const [description, setDescription] = useState('')
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [detectedPayer, setDetectedPayer] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; wallet?: WalletResponse } | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)

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

  async function generateQr() {
    try {
      const token = await auth.getValidAccessToken()
      const response = await api.generateInvoice(token, currency, amount, description || 'Payment')
      setQrPayload(response.qrPayload)
      setResult(null)
    } catch (err: any) {
      console.error('Failed to generate QR', err)
    }
  }

  function startScanning() {
    // Validate amount first
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return
    }

    // Generate QR first if not already done
    if (!qrPayload) {
      generateQr()
    }

    setScanning(true)
    setScanProgress(0)
    setDetectedPayer(null)
    setResult(null)

    // Simulate scanning for a payer
    let progress = 0
    scanIntervalRef.current = setInterval(() => {
      progress += Math.random() * 10
      if (progress >= 100) {
        progress = 100
        setDetectedPayer('payer@example.com')
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
    if (!qrPayload || !detectedPayer) return

    setProcessing(true)
    try {
      const token = await auth.getValidAccessToken()
      const result = await api.payInvoice(token, qrPayload, amount, currency)
      setResult({
        success: true,
        message: `Successfully received ${amount} ${currency} from ${detectedPayer}`,
        wallet: result
      })
      setDetectedPayer(null)
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || 'Payment processing failed'
      })
    } finally {
      setProcessing(false)
    }
  }

  function cancelPayment() {
    setDetectedPayer(null)
    setResult(null)
  }

  function reset() {
    setQrPayload(null)
    setDetectedPayer(null)
    setResult(null)
    setAmount('50.00')
    setCurrency('USD')
    setDescription('')
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
          <h1 className="page-title">{t('invoices.receive.title')}</h1>
          <p className="page-subtitle">Generate QR code to receive payments instantly</p>
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

      {/* Amount Configuration */}
      {!qrPayload && (
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
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Payment Amount</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Enter the amount you want to receive</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'grid', gap: 20 }}>
              <div className="field">
                <label className="field-label">Amount *</label>
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
                    style={{ paddingLeft: 44, fontSize: 20, fontWeight: 600 }}
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

              <div className="field">
                <label className="field-label">Description (Optional)</label>
                <input 
                  className="input" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="What is this payment for?"
                />
              </div>

              <button 
                className="btn btn-primary btn-lg" 
                onClick={generateQr}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                <WalletIcon />
                Generate QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Display */}
      {qrPayload && !detectedPayer && !result && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--color-primary)', boxShadow: 'var(--shadow-glow-sm)' }}>
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
                <CheckIcon />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>QR Code Generated</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Scan to pay {amount} {currency}</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ 
                display: 'inline-flex', 
                padding: 24, 
                background: 'white', 
                borderRadius: 16,
                marginBottom: 16
              }}>
                <QRCodePlaceholder />
              </div>
              
              <div className="font-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
                {amount} {currency}
              </div>
              {description && (
                <div className="text-secondary" style={{ marginBottom: 8 }}>{description}</div>
              )}
              <div className="text-xs text-muted">Scan this QR code to complete payment</div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {!scanning ? (
                <button className="btn btn-success btn-lg" onClick={startScanning}>
                  <CameraIcon />
                  Start Scanner
                </button>
              ) : (
                <button className="btn btn-danger" onClick={stopScanning}>
                  <XIcon />
                  Cancel
                </button>
              )}
              
              <button className="btn btn-secondary" onClick={reset}>
                <XIcon />
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Simulation */}
      {qrPayload && scanning && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'var(--color-warning-alpha-10)',
                color: 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CameraIcon />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Waiting for Payer</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Simulating someone scanning your QR code</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div style={{ 
              position: 'relative',
              width: '100%',
              maxWidth: 400,
              height: 250,
              margin: '0 auto 24px',
              background: 'var(--bg-subtle)',
              borderRadius: 16,
              border: '2px solid var(--border-default)',
              overflow: 'hidden'
            }}>
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
                <p className="text-sm text-secondary mt-2">Waiting for payer scan...</p>
                <p className="text-xs text-muted mt-1">{Math.round(scanProgress)}%</p>
              </div>
            </div>

            <div className="alert alert-info" style={{ margin: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/>
              </svg>
              Simulating a payer scanning your QR code for {amount} {currency}
            </div>
          </div>
        </div>
      )}

      {/* Payer Detected */}
      {detectedPayer && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--color-success)', boxShadow: 'var(--shadow-glow-sm)' }}>
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
                <CheckIcon />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Payment Detected!</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{detectedPayer} wants to pay you</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="text-xs font-semibold text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 12 }}>
              Payment Details
            </div>
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 20,
              background: 'var(--bg-subtle)',
              borderRadius: 12,
              marginBottom: 20
            }}>
              <div className="font-mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-success)' }}>
                +{amount} {currency}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                className="btn btn-success btn-lg" 
                onClick={processPayment}
                disabled={processing}
              >
                {processing ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <CheckIcon />
                    Confirm & Receive
                  </>
                )}
              </button>
              <button className="btn btn-secondary" onClick={cancelPayment} disabled={processing}>
                <XIcon />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`card ${result.success ? 'alert-success' : 'alert-error'}`} style={{ 
          background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          marginBottom: 24
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
                  {result.success ? 'Payment Received!' : 'Payment Failed'}
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

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button className="btn btn-primary" onClick={reset}>
                <WalletIcon />
                Create New Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
