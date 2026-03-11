import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'

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

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
)

type Step = 'amount' | 'qr'

interface PaymentRequest {
  id: string
  amount: string
  currency: 'USD' | 'TRV'
  description: string
  recipientEmail: string
  recipientNickname: string
  timestamp: number
}

export function InvoicesReceive() {
  const auth = useAuth()
  
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'TRV'>('TRV') // Sempre TRV
  const [description, setDescription] = useState('')
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

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
      
      const requestId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      
      const request: PaymentRequest = {
        id: requestId,
        amount,
        currency,
        description: description || `Payment request from ${user.nickname || user.email}`,
        recipientEmail: user.email,
        recipientNickname: user.nickname || user.email.split('@')[0],
        timestamp: Date.now()
      }
      
      setPaymentRequest(request)
      setStep('qr')
    } catch (err) {
      console.error('Failed to generate payment request', err)
      alert('Failed to generate payment request. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function copyLink() {
    if (!paymentRequest) return
    
    const baseUrl = window.location.origin
    const payload = btoa(JSON.stringify(paymentRequest))
    const link = `${baseUrl}/pay?r=${encodeURIComponent(payload)}`
    
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function share() {
    if (!paymentRequest) return
    
    const baseUrl = window.location.origin
    const payload = btoa(JSON.stringify(paymentRequest))
    const link = `${baseUrl}/pay?r=${encodeURIComponent(payload)}`
    
    if (navigator.share) {
      navigator.share({
        title: `Payment request for ${parseFloat(paymentRequest.amount).toFixed(2)} ${paymentRequest.currency}`,
        text: paymentRequest.description,
        url: link
      })
    } else {
      copyLink()
    }
  }

  function downloadQR() {
    if (!qrRef.current) return
    
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `payment-request-${paymentRequest?.id}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const paymentUrl = paymentRequest 
    ? `${window.location.origin}/pay?r=${encodeURIComponent(btoa(JSON.stringify(paymentRequest)))}`
    : ''

  // QR Screen - Estilo Voucher/Binance
  if (step === 'qr' && paymentRequest) {
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
            Back
          </button>
          
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>
            Payment Request
          </h1>
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
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                You're requesting
              </div>
              <div style={{
                fontSize: 36,
                fontWeight: 700,
                color: 'white',
              }}>
                {parseFloat(paymentRequest.amount).toFixed(2)} TRV
              </div>
            </div>

            {/* QR Code Container - Estilo Binance */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
            }}>
              {/* Container branco do QR */}
              <div style={{
                background: 'white',
                padding: 20,
                borderRadius: 24,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }} ref={qrRef}>
                {/* QR Code com logo integrada */}
                <div style={{ position: 'relative', lineHeight: 0 }}>
                  <QRCodeSVG 
                    value={paymentUrl}
                    size={260}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    imageSettings={{
                      src: '/logo-qr.png',
                      height: 56,
                      width: 56,
                      excavate: false,
                    }}
                  />
                  
                  {/* Círculo branco de fundo */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 58,
                    height: 58,
                    background: 'white',
                    borderRadius: '50%',
                    zIndex: -1,
                    border: '2px solid black',
                  }}/>
                </div>
              </div>

              {/* Description */}
              {paymentRequest.description && (
                <p style={{ 
                  fontSize: 14, 
                  color: 'rgba(255,255,255,0.7)',
                  textAlign: 'center',
                  maxWidth: 280,
                }}>
                  {paymentRequest.description}
                </p>
              )}

              {/* Code */}
              <code style={{
                fontSize: 12,
                color: 'white',
                background: 'rgba(124, 58, 237, 0.25)',
                padding: '8px 16px',
                borderRadius: 8,
                wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}>
                {paymentRequest.id.substring(0, 16)}...
              </code>
            </div>
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
          <span style={{ fontSize: 32, fontWeight: 300, color: 'var(--text-muted)' }}>₮</span>
          
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
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
          
          <span
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              color: 'white',
              fontSize: 16,
              fontWeight: 600
            }}
          >
            TRV
          </span>
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
          What's this for? (Optional)
        </label>
        
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Dinner, Freelance work, etc."
          maxLength={100}
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

      {/* Balance Info */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--bg-elevated)',
        borderRadius: 12,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Your balance</span>
          <span style={{ fontWeight: 600 }}>
            {formatUsd(wallet?.trvCents || 0)} TRV
          </span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generatePaymentRequest}
        disabled={!amount || parseFloat(amount) <= 0 || generating}
        style={{
          width: '100%',
          padding: '18px 24px',
          borderRadius: 12,
          border: 'none',
          background: (!amount || parseFloat(amount) <= 0) 
            ? 'var(--bg-elevated)' 
            : 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
          color: (!amount || parseFloat(amount) <= 0) ? 'var(--text-muted)' : 'white',
          fontSize: 16,
          fontWeight: 600,
          cursor: (!amount || parseFloat(amount) <= 0) ? 'not-allowed' : 'pointer'
        }}
      >
        {generating ? (
          <span className="animate-pulse">Generating...</span>
        ) : (
          'Generate QR Code'
        )}
      </button>
    </div>
  )
}
