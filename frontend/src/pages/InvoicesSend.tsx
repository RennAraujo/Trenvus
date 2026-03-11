import { useEffect, useState } from 'react'
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

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
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

type Step = 'scan' | 'confirm' | 'processing' | 'success' | 'error'

export function InvoicesSend() {
  const auth = useAuth()
  
  const [step, setStep] = useState<Step>('scan')
  const [qrInput, setQrInput] = useState('')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

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

  function parseQRCode() {
    if (!qrInput.trim()) {
      setError('Please enter QR code data')
      return
    }

    setError(null)
    
    try {
      // Tenta diferentes formatos de QR code
      let decoded: any
      try {
        decoded = JSON.parse(atob(qrInput.trim()))
      } catch {
        // Tenta parse direto como JSON
        decoded = JSON.parse(qrInput.trim())
      }
      
      // Valida campos obrigatórios
      if (!decoded.amount || !decoded.recipientEmail) {
        throw new Error('Invalid QR code: missing required fields')
      }
      
      setPaymentData({
        id: decoded.id || 'unknown',
        amount: decoded.amount,
        currency: 'TRV', // Sempre TRV, ignora do QR code
        description: decoded.description || '',
        recipientId: decoded.recipientId || 0,
        recipientEmail: decoded.recipientEmail,
        recipientNickname: decoded.recipientNickname || decoded.recipientEmail.split('@')[0],
        timestamp: decoded.timestamp || Date.now()
      })
      
      setStep('confirm')
    } catch (err: any) {
      setError('Invalid QR code. Please check the data and try again.')
      console.error('QR parse error:', err)
    }
  }

  async function confirmPayment() {
    if (!paymentData) return
    
    // A API só suporta transferência TRV
    const balance = wallet?.trvCents
    const amountCents = Math.round(parseFloat(paymentData.amount) * 100)

    if (!balance || balance < amountCents) {
      setError(`Insufficient TRV balance`)
      setStep('error')
      return
    }

    setProcessing(true)
    setStep('processing')

    try {
      const token = await auth.getValidAccessToken()
      
      // Usa a API de transferência TRV
      await api.transferTrv(
        token,
        paymentData.recipientEmail,
        paymentData.amount
      )
      
      setStep('success')
      loadWallet() // Atualiza saldo
    } catch (err: any) {
      setError(err?.message || 'Payment failed')
      setStep('error')
    } finally {
      setProcessing(false)
    }
  }

  function reset() {
    setStep('scan')
    setQrInput('')
    setPaymentData(null)
    setError(null)
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
            {paymentData?.amount} TRV sent to {paymentData?.recipientNickname}
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

  // Processing Screen
  if (step === 'processing') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          background: 'var(--bg-elevated)',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '4px solid var(--border-default)',
            borderTop: '4px solid #7C3AED',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>

          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Processing Payment...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please wait while we process your payment
          </p>
        </div>
      </div>
    )
  }

  // Confirmation Screen - Estilo Voucher/Binance
  if (step === 'confirm' && paymentData) {
    const balance = wallet?.trvCents
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

        {/* Payment Card - Estilo Voucher/Binance */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: 24,
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <div style={{ position: 'relative', zIndex: 1, padding: '32px 24px' }}>
            {/* Logo TRENVUS */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ 
                fontSize: 28, 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.15em',
              }}>
                TRENVUS
              </span>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                You're sending
              </div>
              <div style={{
                fontSize: 36,
                fontWeight: 700,
                color: 'white',
              }}>
                {parseFloat(paymentData.amount).toFixed(2)} TRV
              </div>
            </div>

            {/* Recipient Info */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
            }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>To</span>
                <div style={{ 
                  color: 'white', 
                  fontWeight: 600,
                  fontSize: 18,
                  marginTop: 4
                }}>
                  {paymentData.recipientNickname}
                </div>
                <div style={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  fontSize: 13,
                  marginTop: 2
                }}>
                  {paymentData.recipientEmail}
                </div>
              </div>

              {paymentData.description && (
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>For</span>
                  <div style={{ 
                    color: 'white', 
                    fontSize: 14,
                    marginTop: 4
                  }}>
                    {paymentData.description}
                  </div>
                </div>
              )}
            </div>

            {/* Balance */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Your TRV balance</span>
              <span style={{ 
                fontWeight: 600, 
                color: hasEnoughBalance ? '#10b981' : '#ef4444',
                fontSize: 14,
              }}>
                {formatUsd(balance || 0)} TRV
              </span>
            </div>

            {!hasEnoughBalance && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: 12,
                color: '#ef4444',
                fontSize: 14,
                textAlign: 'center'
              }}>
                Insufficient TRV balance. You need {parseFloat(paymentData.amount).toFixed(2)} TRV.
              </div>
            )}
          </div>
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
            disabled={!hasEnoughBalance || processing}
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
            {processing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    )
  }

  // Scan Input Screen
  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Scan QR Code</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Paste QR code data to send money instantly
        </p>
      </div>

      {/* Balance Card - Apenas TRV */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.1) 0%, rgba(234, 29, 44, 0.05) 100%)',
        border: '1px solid rgba(124, 58, 237, 0.2)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 32
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>TRV Balance</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{formatUsd(wallet?.trvCents || 0)} TRV</div>
        </div>
      </div>

      {/* QR Input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 12,
          color: 'var(--text-secondary)'
        }}>
          QR Code Data
        </label>
        
        <textarea
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          placeholder="Paste QR code data here..."
          rows={5}
          style={{
            width: '100%',
            padding: '16px 20px',
            background: 'var(--bg-elevated)',
            borderRadius: 16,
            border: error ? '2px solid #ef4444' : '2px solid var(--border-default)',
            fontSize: 14,
            outline: 'none',
            resize: 'none',
            fontFamily: 'monospace'
          }}
        />
        
        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>
        )}
      </div>

      <button
        onClick={parseQRCode}
        disabled={!qrInput.trim()}
        style={{
          width: '100%',
          padding: '18px 24px',
          borderRadius: 12,
          border: 'none',
          background: qrInput.trim()
            ? 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)'
            : 'var(--bg-elevated)',
          color: qrInput.trim() ? 'white' : 'var(--text-muted)',
          fontSize: 16,
          fontWeight: 600,
          cursor: qrInput.trim() ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <CameraIcon />
        Process QR Code
      </button>
    </div>
  )
}
