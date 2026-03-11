import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useNavigate } from 'react-router-dom'

// Icons
const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
)

const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
)

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
)

type Step = 'amount' | 'details' | 'qr'

interface PaymentRequest {
  id: string
  amount: string
  currency: 'USD' | 'TRV'
  description: string
  recipientId: number
  recipientEmail: string
  recipientNickname: string
  timestamp: number
}

export function InvoicesReceive() {
  const auth = useAuth()
  
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'TRV'>('USD')
  const [description, setDescription] = useState('')
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

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

  async function generatePaymentRequest() {
    if (!amount || parseFloat(amount) <= 0) return
    
    setGenerating(true)
    try {
      const token = await auth.getValidAccessToken()
      const user = await api.getMe(token)
      
      // Gera ID único para o payment request
      const requestId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      
      const request: PaymentRequest = {
        id: requestId,
        amount,
        currency,
        description: description || `Payment request from ${user.nickname || user.email}`,
        recipientId: 0, // Será preenchido pelo backend ao processar
        recipientEmail: user.email,
        recipientNickname: user.nickname || user.email.split('@')[0],
        timestamp: Date.now()
      }
      
      setPaymentRequest(request)
      setStep('qr')
    } catch (err) {
      console.error('Failed to generate payment request', err)
    } finally {
      setGenerating(false)
    }
  }

  function getPaymentUrl() {
    if (!paymentRequest) return ''
    const baseUrl = window.location.origin
    const payload = btoa(JSON.stringify(paymentRequest))
    return `${baseUrl}/pay?r=${payload}`
  }

  function copyLink() {
    navigator.clipboard.writeText(getPaymentUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function share() {
    if (navigator.share) {
      navigator.share({
        title: `Payment request for ${amount} ${currency}`,
        text: paymentRequest?.description || 'Payment request',
        url: getPaymentUrl()
      })
    } else {
      copyLink()
    }
  }

  function downloadQR() {
    const svg = document.querySelector('#payment-qr-code svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `payment-request-${paymentRequest?.id}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  // QR Code Screen
  if (step === 'qr' && paymentRequest) {
    const paymentUrl = getPaymentUrl()
    
    return (
      <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setStep('amount')}
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
            New Request
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Your QR Code</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Share this QR code or link to receive payment
          </p>
        </div>

        {/* QR Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.1) 0%, rgba(234, 29, 44, 0.05) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24
        }}>
          {/* Amount */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              You're requesting
            </div>
            <div style={{
              fontSize: 42,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {parseFloat(amount).toFixed(2)} {currency}
            </div>
          </div>

          {/* QR Code */}
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 20,
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 24
          }} id="payment-qr-code">
            <QRCodeSVG 
              value={paymentUrl}
              size={240}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
              includeMargin={false}
            />
          </div>

          {/* Description */}
          {description && (
            <div style={{
              textAlign: 'center',
              padding: '12px 16px',
              background: 'var(--bg-elevated)',
              borderRadius: 12,
              marginBottom: 16
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>{description}</span>
            </div>
          )}

          {/* Your Balance */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            background: 'var(--bg-elevated)',
            borderRadius: 12
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Your balance</span>
            <span style={{ fontWeight: 600 }}>
              {currency === 'USD' 
                ? formatUsd(wallet?.usdCents || 0)
                : formatUsd(wallet?.trvCents || 0)} {currency}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <button
            onClick={copyLink}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 20px',
              borderRadius: 12,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={share}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ShareIcon />
            Share
          </button>
        </div>

        <button
          onClick={downloadQR}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '14px 20px',
            borderRadius: 12,
            border: '1px solid var(--border-default)',
            background: 'transparent',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <DownloadIcon />
          Download QR Code
        </button>
      </div>
    )
  }

  // Amount Input Screen
  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Request Money</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Create a payment request that anyone can pay
        </p>
      </div>

      {/* Amount Input */}
      <div style={{ marginBottom: 32 }}>
        <label style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 12,
          color: 'var(--text-secondary)'
        }}>
          Amount
        </label>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '20px 24px',
          background: 'var(--bg-elevated)',
          borderRadius: 16,
          border: '2px solid var(--border-default)'
        }}>
          <span style={{ fontSize: 32, fontWeight: 300, color: 'var(--text-muted)' }}>
            {currency === 'USD' ? '$' : '₮'}
          </span>
          
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 42,
              fontWeight: 600,
              outline: 'none',
              fontFamily: 'var(--font-mono)'
            }}
          />
          
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'USD' | 'TRV')}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              color: 'white',
              fontSize: 16,
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
          marginBottom: 12,
          color: 'var(--text-secondary)'
        }}>
          What's this for? <span style={{ fontWeight: 400 }}>(optional)</span>
        </label>
        
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner, Freelance work, etc."
          style={{
            width: '100%',
            padding: '18px 20px',
            background: 'var(--bg-elevated)',
            borderRadius: 16,
            border: '2px solid var(--border-default)',
            fontSize: 16,
            outline: 'none'
          }}
        />
      </div>

      {/* Continue Button */}
      <button
        onClick={generatePaymentRequest}
        disabled={!amount || parseFloat(amount) <= 0 || generating}
        style={{
          width: '100%',
          padding: '20px 24px',
          borderRadius: 16,
          border: 'none',
          background: (!amount || parseFloat(amount) <= 0 || generating)
            ? 'var(--bg-elevated)'
            : 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
          color: (!amount || parseFloat(amount) <= 0 || generating)
            ? 'var(--text-muted)'
            : 'white',
          fontSize: 18,
          fontWeight: 600,
          cursor: (!amount || parseFloat(amount) <= 0 || generating)
            ? 'not-allowed'
            : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
        }}
      >
        <WalletIcon />
        {generating ? 'Generating...' : 'Generate QR Code'}
      </button>

      {/* Info */}
      <p style={{
        textAlign: 'center',
        marginTop: 24,
        fontSize: 14,
        color: 'var(--text-secondary)'
      }}>
        Anyone with the link can pay you. No fees for receiving.
      </p>
    </div>
  )
}
