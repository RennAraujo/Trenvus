import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const DollarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
)

const ScanLineIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <line x1="4" x2="20" y1="12" y2="12"/>
  </svg>
)

const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/>
    <path d="M22 2 11 13"/>
  </svg>
)

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
)

// Interface para QR detectado
interface DetectedInvoice {
  id: string
  payload: string
  amount: string
  currency: 'USD' | 'TRV'
  recipientEmail: string
  recipientNickname: string
  description: string
  timestamp: number
}

export function InvoicesSend() {
  const auth = useAuth()
  const { t } = useI18n()
  
  const [step, setStep] = useState<'form' | 'scanning' | 'confirmation' | 'success' | 'error'>('form')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'TRV'>('USD')
  const [scanProgress, setScanProgress] = useState(0)
  const [detectedInvoice, setDetectedInvoice] = useState<DetectedInvoice | null>(null)
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
    setStep('scanning')
    setScanProgress(0)
    setDetectedInvoice(null)

    // Simulate scanning progress
    let progress = 0
    scanIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        // Simula detecção de QR code
        const mockInvoice: DetectedInvoice = {
          id: 'inv-' + Date.now(),
          payload: btoa(JSON.stringify({
            type: 'INVOICE',
            invoiceId: 'inv-' + Date.now(),
            recipientId: 2,
            recipientEmail: 'user2@test.com',
            recipientNickname: 'teste2',
            amount: amount || '25.00',
            currency: currency,
            description: 'Payment via QR',
            timestamp: Date.now()
          })),
          amount: amount || '25.00',
          currency: currency,
          recipientEmail: 'user2@test.com',
          recipientNickname: 'teste2',
          description: 'Payment via QR',
          timestamp: Date.now()
        }
        setDetectedInvoice(mockInvoice)
        setStep('confirmation')
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current)
        }
      }
      setScanProgress(progress)
    }, 200)
  }

  function stopScanning() {
    setStep('form')
    setScanProgress(0)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
  }

  async function confirmPayment() {
    if (!detectedInvoice) return

    setProcessing(true)
    try {
      const token = await auth.getValidAccessToken()
      const result = await api.payInvoice(token, detectedInvoice.payload, detectedInvoice.amount, detectedInvoice.currency)
      setResult({
        success: true,
        message: `Successfully paid ${detectedInvoice.amount} ${detectedInvoice.currency} to ${detectedInvoice.recipientNickname}`,
        wallet: result
      })
      setStep('success')
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || 'Payment failed'
      })
      setStep('error')
    } finally {
      setProcessing(false)
    }
  }

  function rejectPayment() {
    setDetectedInvoice(null)
    setStep('form')
  }

  function reset() {
    setStep('form')
    setDetectedInvoice(null)
    setResult(null)
    setError(null)
    setAmount('')
  }

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [])

  // Success/Error Screen
  if (step === 'success' || step === 'error') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          background: step === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            {step === 'success' ? <CheckIcon /> : <XIcon />}
          </div>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            {step === 'success' ? 'Payment Successful!' : 'Payment Failed'}
          </h2>
          
          <p style={{ opacity: 0.9, marginBottom: 32 }}>{result?.message}</p>

          {result?.success && result.wallet && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>USD Balance</span>
                <span style={{ fontWeight: 600 }}>{formatUsd(result.wallet.usdCents)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TRV Balance</span>
                <span style={{ fontWeight: 600 }}>{formatUsd(result.wallet.trvCents)}</span>
              </div>
            </div>
          )}

          <button
            onClick={reset}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'white',
              color: step === 'success' ? '#059669' : '#dc2626',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {step === 'success' ? 'New Payment' : 'Try Again'}
          </button>
        </div>
      </div>
    )
  }

  // Confirmation Screen
  if (step === 'confirmation' && detectedInvoice) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setStep('form')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: 16
            }}
          >
            <ArrowLeftIcon />
            Back
          </button>
          
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Confirm Payment</h1>
        </div>

        {/* Payment Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          border: '1px solid rgba(124, 58, 237, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <WalletIcon />
            </div>
            
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              You will pay
            </div>
            
            <div style={{
              fontSize: 48,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {detectedInvoice.amount} {detectedInvoice.currency}
            </div>
          </div>

          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: 16, 
            padding: 20,
            marginBottom: 24
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>To</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{detectedInvoice.recipientNickname}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{detectedInvoice.recipientEmail}</div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Description</span>
              <span>{detectedInvoice.description}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>From</span>
              <span>Your Wallet</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={rejectPayment}
              disabled={processing}
              style={{
                flex: 1,
                padding: '16px 24px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reject
            </button>

            <button
              onClick={confirmPayment}
              disabled={processing}
              style={{
                flex: 2,
                padding: '16px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.7 : 1
              }}
            >
              {processing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Scanning Screen
  if (step === 'scanning') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={stopScanning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            <ArrowLeftIcon />
            Cancel
          </button>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: 280,
            height: 280,
            margin: '0 auto 32px',
            background: 'var(--bg-subtle)',
            borderRadius: 20,
            overflow: 'hidden',
            border: '2px solid var(--border-default)'
          }}>
            {/* Scanning Animation */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 0%, rgba(124,58,237,0.1) 50%, transparent 100%)',
              animation: 'scan 2s linear infinite'
            }} />
            <style>{`
              @keyframes scan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
              }
            `}</style>
            
            {/* Corner Markers */}
            <div style={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderTop: '3px solid #7C3AED', borderLeft: '3px solid #7C3AED' }} />
            <div style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderTop: '3px solid #7C3AED', borderRight: '3px solid #7C3AED' }} />
            <div style={{ position: 'absolute', bottom: 20, left: 20, width: 40, height: 40, borderBottom: '3px solid #7C3AED', borderLeft: '3px solid #7C3AED' }} />
            <div style={{ position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, borderBottom: '3px solid #7C3AED', borderRight: '3px solid #7C3AED' }} />

            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <CameraIcon style={{ color: '#7C3AED', marginBottom: 12 }} />
              <p style={{ color: 'var(--text-secondary)' }}>Scanning QR Code...</p>
            </div>

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
                background: 'linear-gradient(90deg, #7C3AED, #EA1D2C)',
                transition: 'width 0.1s linear'
              }} />
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)' }}>
            Position the QR code within the frame to scan
          </p>
        </div>
      </div>
    )
  }

  // Form Screen
  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Send Payment</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Scan a QR code to make a payment</p>
      </div>

      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        border: '1px solid rgba(124, 58, 237, 0.3)'
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>USD Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{wallet ? formatUsd(wallet.usdCents) : '—'}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>TRV Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{wallet ? formatUsd(wallet.trvCents) : '—'}</div>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ 
          display: 'block', 
          fontSize: 14, 
          fontWeight: 500, 
          marginBottom: 8,
          color: 'var(--text-secondary)'
        }}>
          Expected Amount (optional)
        </label>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: 'var(--bg-elevated)',
          borderRadius: 16,
          border: '2px solid var(--border-default)'
        }}>
          <span style={{ fontSize: 24, fontWeight: 600 }}>$</span>
          
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 28,
              fontWeight: 700,
              outline: 'none',
              fontFamily: 'var(--font-mono)'
            }}
          />
          
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'USD' | 'TRV')}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="USD">USD</option>
            <option value="TRV">TRV</option>
          </select>
        </div>
      </div>

      {/* Scan Button */}
      <button
        onClick={startScanning}
        style={{
          width: '100%',
          padding: '20px 24px',
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
          color: 'white',
          fontSize: 18,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
        }}
      >
        <CameraIcon />
        Scan QR Code
      </button>

      <p style={{ 
        textAlign: 'center', 
        marginTop: 24, 
        fontSize: 14, 
        color: 'var(--text-secondary)' 
      }}>
        Point your camera at a payment QR code to scan
      </p>
    </div>
  )
}
