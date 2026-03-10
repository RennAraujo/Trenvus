import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from './api'
import { useAuth } from './auth'
import { useI18n } from './i18n'

// Icons
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
)

const InvoiceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" x2="8" y1="13" y2="13"/>
    <line x1="16" x2="8" y1="17" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const LinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
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

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  currency: 'USD' | 'TRV'
}

type Step = 'menu' | 'invoice-form' | 'invoice-qr' | 'link-form' | 'link-qr'

export function InvoiceModal({ isOpen, onClose, currency }: InvoiceModalProps) {
  const auth = useAuth()
  const { t, locale } = useI18n()
  const [step, setStep] = useState<Step>('menu')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleCreateInvoice = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    
    setLoading(true)
    try {
      const token = await auth.getValidAccessToken()
      const response = await api.generateInvoice(token, amount, currency, description || 'Invoice payment')
      setQrPayload(response.qrPayload)
      setStep('invoice-qr')
    } catch (err) {
      console.error('Failed to generate invoice', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    
    setLoading(true)
    try {
      const token = await auth.getValidAccessToken()
      const response = await api.generateInvoice(token, amount, currency, description || 'Payment link')
      setQrPayload(response.qrPayload)
      setStep('link-qr')
    } catch (err) {
      console.error('Failed to generate link', err)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (qrPayload) {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/pay?invoice=${encodeURIComponent(qrPayload)}`
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const share = () => {
    if (navigator.share && qrPayload) {
      navigator.share({
        title: `Payment request`,
        text: `Payment request for ${amount} ${currency}`,
        url: `${window.location.origin}/pay?invoice=${encodeURIComponent(qrPayload)}`
      })
    } else {
      copyLink()
    }
  }

  const reset = () => {
    setStep('menu')
    setAmount('')
    setDescription('')
    setQrPayload(null)
    setCopied(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Menu Step
  if (step === 'menu') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease'
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
        
        <div style={{
          background: 'var(--bg-primary)',
          width: '100%',
          maxWidth: 480,
          borderRadius: '24px 24px 0 0',
          padding: 24,
          animation: 'slideUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {t('invoice.howToRequest') || 'How would you like to request?'}
            </h2>
            <button
              onClick={handleClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--bg-elevated)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setStep('invoice-form')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-primary-alpha-10)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <InvoiceIcon />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  {t('invoice.createInvoice') || 'Create invoice'}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {t('invoice.createInvoiceDesc') || 'Generate a professional invoice with QR code'}
                </div>
              </div>
              
              <ArrowRightIcon />
            </button>

            <button
              onClick={() => setStep('link-form')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-success-alpha-10)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LinkIcon />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  {t('invoice.sharePaymentLink') || 'Share payment link'}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {t('invoice.sharePaymentLinkDesc') || 'Create a simple link to share anywhere'}
                </div>
              </div>
              
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Invoice Form Step
  if (step === 'invoice-form' || step === 'link-form') {
    const isInvoice = step === 'invoice-form'
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-default)'
        }}>
          <button
            onClick={() => setStep('menu')}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--bg-elevated)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {isInvoice ? (t('invoice.createInvoice') || 'Create invoice') : (t('invoice.sharePaymentLink') || 'Share payment link')}
          </h2>
        </div>

        {/* Form */}
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            {/* Amount */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                color: 'var(--text-secondary)'
              }}>
                {t('invoice.amount') || 'Amount'}
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
                <span style={{ fontSize: 24, fontWeight: 600 }}>
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
                    fontSize: 32,
                    fontWeight: 700,
                    outline: 'none',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                
                <span style={{
                  padding: '6px 12px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  {currency}
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                color: 'var(--text-secondary)'
              }}>
                {t('invoice.description') || 'Description (optional)'}
              </label>
              
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isInvoice ? "What is this invoice for?" : "What is this payment for?"}
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

            {/* Due Date (only for invoice) */}
            {isInvoice && (
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  color: 'var(--text-secondary)'
                }}>
                {t('invoice.dueDate') || 'Due date'}
                </label>
                
                <div style={{
                  padding: '16px 20px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 16,
                  border: '2px solid var(--border-default)',
                  fontSize: 16
                }}>
                  {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: 24,
          borderTop: '1px solid var(--border-default)'
        }}>
          <button
            onClick={isInvoice ? handleCreateInvoice : handleCreateLink}
            disabled={!amount || parseFloat(amount) <= 0 || loading}
            style={{
              width: '100%',
              padding: '18px 24px',
              borderRadius: 16,
              border: 'none',
              background: (!amount || parseFloat(amount) <= 0 || loading) 
                ? 'var(--bg-elevated)' 
                : 'var(--color-primary)',
              color: (!amount || parseFloat(amount) <= 0 || loading) 
                ? 'var(--text-muted)' 
                : 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: (!amount || parseFloat(amount) <= 0 || loading) 
                ? 'not-allowed' 
                : 'pointer'
            }}
            >
            {loading 
              ? (t('actions.processing') || 'Processing...') 
              : (isInvoice 
                ? (t('invoice.createInvoice') || 'Create invoice') 
                : (t('invoice.createLink') || 'Create link'))}
          </button>
        </div>
      </div>
    )
  }

  // QR Display Step
  if (step === 'invoice-qr' || step === 'link-qr') {
    const isInvoice = step === 'invoice-qr'
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px'
        }}>
          <div />
          
          <button
            onClick={handleClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--bg-elevated)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}>
          <div style={{
            background: 'white',
            padding: 32,
            borderRadius: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            marginBottom: 32
          }}>
            {qrPayload && (
              <QRCodeSVG 
                value={qrPayload}
                size={240}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            )}
          </div>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              marginBottom: 8
            }}>
              {isInvoice 
                ? (t('invoice.scanToPay') || 'Scan to pay') 
                : (t('invoice.paymentLink') || 'Payment link')}
            </div>
            
            <div style={{
              fontSize: 36,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}>
              {parseFloat(amount).toFixed(2)} {currency}
            </div>
            
            {description && (
              <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                {description}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: 12,
            width: '100%',
            maxWidth: 400
          }}>
            <button
              onClick={copyLink}
              style={{
                flex: 1,
                padding: '16px 24px',
                borderRadius: 16,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-elevated)',
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
              {copied 
                ? (t('actions.copied') || 'Copied!') 
                : (t('invoice.copyLink') || 'Copy link')}
            </button>
            
            <button
              onClick={share}
              style={{
                flex: 1,
                padding: '16px 24px',
                borderRadius: 16,
                border: 'none',
                background: 'var(--color-primary)',
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
              {t('invoice.share') || 'Share'}
            </button>
          </div>

          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {t('invoice.createNew') || 'Create new'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
