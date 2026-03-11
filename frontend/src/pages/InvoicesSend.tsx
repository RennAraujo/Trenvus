import { useEffect, useRef, useState } from 'react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'

// Icons
const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
)

const ScanLineIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="4" x2="20" y1="12" y2="12"/>
  </svg>
)

interface PaymentData {
  id: string
  amount: string
  currency: 'USD' | 'TRV'
  description: string
  recipientId: number
  recipientEmail: string
  recipientNickname: string
  timestamp: number
}

type Step = 'scan' | 'scanning' | 'confirm' | 'processing' | 'success' | 'error'

export function InvoicesSend() {
  const auth = useAuth()
  
  const [step, setStep] = useState<Step>('scan')
  const [qrInput, setQrInput] = useState('')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadWallet()
  }, [])

  async function loadWallet() {
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getWallet(token)
      setWallet(data)
    } catch (err) {
      console.error('Failed to load wallet', err)
    }
  }

  function startScanning() {
    setStep('scanning')
    setScanProgress(0)
    setError(null)

    // Simulate scanning animation
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        
        // Try to parse QR input if provided
        if (qrInput.trim()) {
          try {
            const decoded = JSON.parse(atob(qrInput.trim()))
            setPaymentData(decoded)
            setStep('confirm')
          } catch {
            setError('Invalid QR code. Please try again.')
            setStep('scan')
          }
        } else {
          // Demo data for testing
          setPaymentData({
            id: 'demo-123',
            amount: '25.00',
            currency: 'USD',
            description: 'Demo payment request',
            recipientId: 2,
            recipientEmail: 'user2@test.com',
            recipientNickname: 'teste2',
            timestamp: Date.now()
          })
          setStep('confirm')
        }
      }
      setScanProgress(progress)
    }, 200)
  }

  function cancelScan() {
    setStep('scan')
    setScanProgress(0)
    setQrInput('')
  }

  async function confirmPayment() {
    if (!paymentData) return

    const balance = paymentData.currency === 'USD' 
      ? wallet?.usdCents 
      : wallet?.trvCents
    const amountCents = Math.round(parseFloat(paymentData.amount) * 100)

    if (!balance || balance < amountCents) {
      setError(`Insufficient ${paymentData.currency} balance`)
      setStep('error')
      return
    }

    setStep('processing')

    try {
      const token = await auth.getValidAccessToken()
      const payload = btoa(JSON.stringify(paymentData))
      await api.payInvoice(token, payload, paymentData.amount, paymentData.currency)
      setStep('success')
      loadWallet() // Refresh balance
    } catch (err: any) {
      setError(err?.message || 'Payment failed')
      setStep('error')
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      // In a real app, you'd decode the QR from the image
      // For now, we'll just simulate finding a payment
      setPaymentData({
        id: 'scanned-' + Date.now(),
        amount: '50.00',
        currency: 'USD',
        description: 'Scanned payment',
        recipientId: 3,
        recipientEmail: 'user3@test.com',
        recipientNickname: 'teste3',
        timestamp: Date.now()
      })
      setStep('confirm')
    }
    reader.readAsDataURL(file)
  }

  function reset() {
    setStep('scan')
    setPaymentData(null)
    setQrInput('')
    setError(null)
    setScanProgress(0)
  }

  // Success Screen
  if (step === 'success') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
            <CheckIcon />
          </div>

          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Payment Sent!</h2>
          <p style={{ opacity: 0.9, marginBottom: 32 }}>
            {paymentData?.amount} {paymentData?.currency} sent to {paymentData?.recipientNickname}
          </p>

          <button
            onClick={reset}
            style={{
              padding: '16px 32px',
              borderRadius: 12,
              border: 'none',
              background: 'white',
              color: '#059669',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Scan Another
          </button>
        </div>
      </div>
    )
  }

  // Error Screen
  if (step === 'error') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: '#ef4444'
          }}>
            <XIcon />
          </div>

          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Payment Failed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            {error || 'Something went wrong'}
          </p>

          <button
            onClick={reset}
            style={{
              padding: '16px 32px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Confirmation Screen
  if (step === 'confirm' && paymentData) {
    const balance = paymentData.currency === 'USD' 
      ? wallet?.usdCents 
      : wallet?.trvCents
    const amountCents = Math.round(parseFloat(paymentData.amount) * 100)
    const hasEnoughBalance = balance && balance >= amountCents

    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setStep('scan')}
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
          background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.1) 0%, rgba(234, 29, 44, 0.05) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>You're sending</div>
            <div style={{
              fontSize: 48,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {parseFloat(paymentData.amount).toFixed(2)} {paymentData.currency}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: 16,
            padding: 20
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: '1px solid var(--border-default)'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>To</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{paymentData.recipientNickname}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{paymentData.recipientEmail}</div>
              </div>
            </div>

            {paymentData.description && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-default)'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>For</span>
                <span>{paymentData.description}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Your balance</span>
              <span style={{ 
                fontWeight: 600, 
                color: hasEnoughBalance ? '#10b981' : '#ef4444'
              }}>
                {formatUsd(balance || 0)} {paymentData.currency}
              </span>
            </div>
          </div>

          {!hasEnoughBalance && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
              color: '#ef4444',
              fontSize: 14,
              textAlign: 'center'
            }}>
              Insufficient balance. You need {parseFloat(paymentData.amount).toFixed(2)} {paymentData.currency}.
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setStep('scan')}
            style={{
              flex: 1,
              padding: '18px 24px',
              borderRadius: 16,
              border: '1px solid var(--border-default)',
              background: 'transparent',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            onClick={confirmPayment}
            disabled={!hasEnoughBalance}
            style={{
              flex: 2,
              padding: '18px 24px',
              borderRadius: 16,
              border: 'none',
              background: hasEnoughBalance
                ? 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)'
                : 'var(--bg-elevated)',
              color: hasEnoughBalance ? 'white' : 'var(--text-muted)',
              fontSize: 16,
              fontWeight: 600,
              cursor: hasEnoughBalance ? 'pointer' : 'not-allowed'
            }}
          >
            Confirm Payment
          </button>
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
            onClick={cancelScan}
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
              background: 'linear-gradient(180deg, transparent 0%, rgba(124,58,237,0.15) 50%, transparent 100%)',
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
              textAlign: 'center',
              color: '#7C3AED'
            }}>
              <CameraIcon />
              <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Scanning...</p>
            </div>

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
            Processing QR code...
          </p>
        </div>
      </div>
    )
  }

  // Scan Input Screen (default)
  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Scan QR Code</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Scan a payment QR code to send money instantly
        </p>
      </div>

      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.1) 0%, rgba(234, 29, 44, 0.05) 100%)',
        border: '1px solid rgba(124, 58, 237, 0.2)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>USD Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{formatUsd(wallet?.usdCents || 0)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>TRV Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{formatUsd(wallet?.trvCents || 0)}</div>
          </div>
        </div>
      </div>

      {/* Scan Button */}
      <button
        onClick={startScanning}
        style={{
          width: '100%',
          padding: '24px',
          borderRadius: 20,
          border: '2px dashed var(--border-default)',
          background: 'var(--bg-elevated)',
          cursor: 'pointer',
          marginBottom: 24
        }}
      >
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'white'
        }}>
          <CameraIcon />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
          Tap to Scan QR Code
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Or paste QR code data below
        </div>
      </button>

      {/* Manual Input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 8,
          color: 'var(--text-secondary)'
        }}>
          Or paste QR code data
        </label>
        
        <textarea
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          placeholder="Paste QR code data here..."
          rows={3}
          style={{
            width: '100%',
            padding: '16px 20px',
            background: 'var(--bg-elevated)',
            borderRadius: 16,
            border: '2px solid var(--border-default)',
            fontSize: 14,
            outline: 'none',
            resize: 'none',
            fontFamily: 'monospace'
          }}
        />
      </div>

      <button
        onClick={startScanning}
        disabled={!qrInput.trim()}
        style={{
          width: '100%',
          padding: '16px 24px',
          borderRadius: 12,
          border: 'none',
          background: qrInput.trim()
            ? 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)'
            : 'var(--bg-elevated)',
          color: qrInput.trim() ? 'white' : 'var(--text-muted)',
          fontSize: 16,
          fontWeight: 600,
          cursor: qrInput.trim() ? 'pointer' : 'not-allowed'
        }}
      >
        Process QR Code
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  )
}
