import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
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

const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
)

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
  </svg>
)

export function InvoicesReceive() {
  const auth = useAuth()
  const { t } = useI18n()
  
  const [step, setStep] = useState<'form' | 'qr' | 'waiting' | 'received' | 'error'>('form')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'TRV'>('USD')
  const [description, setDescription] = useState('')
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [receivedPayment, setReceivedPayment] = useState<{
    amount: string
    currency: string
    from: string
  } | null>(null)

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
  }, [])

  async function generateQR() {
    if (!amount || parseFloat(amount) <= 0) return

    try {
      const token = await auth.getValidAccessToken()
      const response = await api.generateInvoice(token, amount, currency, description || 'Payment')
      
      setQrPayload(response.qrPayload)
      
      // Gerar link de pagamento
      const baseUrl = window.location.origin
      const link = `${baseUrl}/pay?invoice=${encodeURIComponent(response.qrPayload)}`
      setPaymentLink(link)
      
      setStep('qr')
    } catch (err: any) {
      console.error('Failed to generate QR', err)
    }
  }

  function copyLink() {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function share() {
    if (navigator.share && paymentLink) {
      navigator.share({
        title: 'Payment Request',
        text: `Payment request for ${amount} ${currency}`,
        url: paymentLink
      })
    } else {
      copyLink()
    }
  }

  function startWaiting() {
    setStep('waiting')
    // Simula recebimento após alguns segundos
    setTimeout(() => {
      setReceivedPayment({
        amount: amount,
        currency: currency,
        from: 'user2@test.com'
      })
      setStep('received')
      loadWallet() // Atualiza saldo
    }, 10000)
  }

  function reset() {
    setStep('form')
    setQrPayload(null)
    setPaymentLink(null)
    setReceivedPayment(null)
    setAmount('')
    setDescription('')
    setCopied(false)
  }

  // Success Screen - Payment Received
  if (step === 'received' && receivedPayment) {
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
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Payment Received!</h2>
          
          <p style={{ opacity: 0.9, marginBottom: 32 }}>
            You received {receivedPayment.amount} {receivedPayment.currency} from {receivedPayment.from}
          </p>

          <button
            onClick={reset}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'white',
              color: '#059669',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create New Request
          </button>
        </div>
      </div>
    )
  }

  // Waiting Screen
  if (step === 'waiting') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setStep('qr')}
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
            Back to QR
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center',
          border: '1px solid rgba(124, 58, 237, 0.3)'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'pulse 2s infinite'
          }}>
            <WalletIcon />
          </div>
          
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.8; }
            }
          `}</style>
          
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'white' }}>Waiting for Payment</h2>
          
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
            Share the QR code or link with the payer. You'll be notified when payment is received.
          </p>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24
          }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Expected Amount</div>
            <div style={{
              fontSize: 36,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {amount} {currency}
            </div>
          </div>

          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'white',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Cancel Request
          </button>
        </div>
      </div>
    )
  }

  // QR Screen
  if (step === 'qr' && qrPayload) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={reset}
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
            Back
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          borderRadius: 24,
          padding: 32,
          border: '1px solid rgba(124, 58, 237, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Scan to pay</div>
            
            <div style={{
              background: 'white',
              padding: 24,
              borderRadius: 20,
              display: 'inline-block',
              marginBottom: 24
            }}>
              <QRCodeSVG 
                value={qrPayload}
                size={240}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            <div style={{
              fontSize: 48,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {amount} {currency}
            </div>

            {description && (
              <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.6)' }}>{description}</div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              onClick={copyLink}
              style={{
                flex: 1,
                padding: '16px 24px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>

            <button
              onClick={share}
              style={{
                flex: 1,
                padding: '16px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <ShareIcon />
              Share
            </button>
          </div>

          <button
            onClick={startWaiting}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <RefreshIcon />
            Simulate Payment Received
          </button>
        </div>
      </div>
    )
  }

  // Form Screen
  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Request Payment</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Generate a QR code to receive payment</p>
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
          Amount *
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

      {/* Description Input */}
      <div style={{ marginBottom: 32 }}>
        <label style={{ 
          display: 'block', 
          fontSize: 14, 
          fontWeight: 500, 
          marginBottom: 8,
          color: 'var(--text-secondary)'
        }}>
          Description (optional)
        </label>
        
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this payment for?"
          style={{
            width: '100%',
            padding: '16px 20px',
            background: 'var(--bg-elevated)',
            borderRadius: 16,
            border: '2px solid var(--border-default)',
            fontSize: 16,
            outline: 'none'
          }}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={generateQR}
        disabled={!amount || parseFloat(amount) <= 0}
        style={{
          width: '100%',
          padding: '20px 24px',
          borderRadius: 16,
          border: 'none',
          background: (!amount || parseFloat(amount) <= 0) 
            ? 'var(--bg-elevated)' 
            : 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
          color: (!amount || parseFloat(amount) <= 0) 
            ? 'var(--text-muted)' 
            : 'white',
          fontSize: 18,
          fontWeight: 600,
          cursor: (!amount || parseFloat(amount) <= 0) 
            ? 'not-allowed' 
            : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
        }}
      >
        <WalletIcon />
        Generate QR Code
      </button>

      <p style={{ 
        textAlign: 'center', 
        marginTop: 24, 
        fontSize: 14, 
        color: 'var(--text-secondary)' 
      }}>
        Generate a QR code that others can scan to pay you
      </p>
    </div>
  )
}
