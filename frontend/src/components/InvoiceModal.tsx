import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

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
}

type Step = 'menu' | 'invoice-form' | 'invoice-qr' | 'link-form' | 'link-qr'

export function InvoiceModal({ isOpen, onClose }: InvoiceModalProps) {
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
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }
    if (amountNum > 1000000) {
      alert('Maximum invoice amount is 1,000,000')
      return
    }
    
    setLoading(true)
    try {
      const token = await auth.getValidAccessToken()
      const response = await api.generateInvoice(token, amount, 'TRV', description || 'Invoice payment')
      setQrPayload(response.qrPayload)
      setStep('invoice-qr')
    } catch (err: any) {
      console.error('Failed to generate invoice', err)
      alert(err?.message || 'Failed to generate invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }
    if (amountNum > 1000000) {
      alert('Maximum invoice amount is 1,000,000')
      return
    }
    
    setLoading(true)
    try {
      const token = await auth.getValidAccessToken()
      const response = await api.generateInvoice(token, amount, 'TRV', description || 'Payment link')
      setQrPayload(response.qrPayload)
      setStep('link-qr')
    } catch (err: any) {
      console.error('Failed to generate link', err)
      alert(err?.message || 'Failed to generate link')
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
        text: `Payment request for ${amount} TRV`,
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
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
        padding: 16
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
        
        <div style={{
          background: 'var(--bg-primary)',
          width: '100%',
          maxWidth: 420,
          borderRadius: 20,
          padding: '28px 24px',
          animation: 'scaleIn 0.25s ease',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24
          }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0' }}>
                Receber Pagamento
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                Escolha como quer receber TRV
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--bg-elevated)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-default)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
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
                border: '2px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.background = 'var(--color-primary-alpha-10)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.background = 'var(--bg-elevated)'
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
              }}>
                <InvoiceIcon />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  QR Code
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  O pagador escaneia com a câmera
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
                border: '2px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-success)'
                e.currentTarget.style.background = 'var(--color-success-alpha-10)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.background = 'var(--bg-elevated)'
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-success) 0%, #10b981 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <LinkIcon />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  Link de Pagamento
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Copie e envie por WhatsApp, email ou redes
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
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
        padding: 16
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
        
        <div style={{
          background: 'var(--bg-primary)',
          width: '100%',
          maxWidth: 420,
          borderRadius: 20,
          overflow: 'hidden',
          animation: 'scaleIn 0.25s ease',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)'
          }}>
            <button
              onClick={() => setStep('menu')}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--bg-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-default)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              {isInvoice ? 'QR Code' : 'Link de Pagamento'}
            </h2>
          </div>

          {/* Form */}
          <div style={{ padding: 24 }}>
            {/* Amount */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 10,
                color: 'var(--text-primary)'
              }}>
                Quanto quer receber?
              </label>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '18px 20px',
                background: 'var(--bg-elevated)',
                borderRadius: 16,
                border: '2px solid var(--border-default)',
                transition: 'all 0.2s'
              }}>
                <span style={{ 
                  fontSize: 28, 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>₮</span>
                
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
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)'
                  }}
                />
                
                <span style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700
                }}>
                  TRV
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 10,
                color: 'var(--text-primary)'
              }}>
                Do que se trata? (opcional)
              </label>
              
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isInvoice ? "Ex: Pagamento de serviço" : "Ex: Doação para o projeto"}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 16,
                  border: '2px solid var(--border-default)',
                  fontSize: 16,
                  outline: 'none',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
              />
            </div>

            {/* Due Date (only for invoice) */}
            {isInvoice && (
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 10,
                  color: 'var(--text-primary)'
                }}>
                  {t('invoice.dueDate') || 'Vencimento'}
                </label>
                
                <div style={{
                  padding: '16px 20px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 16,
                  border: '2px solid var(--border-default)',
                  fontSize: 16,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" x2="16" y1="2" y2="6"/>
                    <line x1="8" x2="8" y1="2" y2="6"/>
                    <line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                  {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)'
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
                  ? 'var(--bg-subtle)' 
                  : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                color: (!amount || parseFloat(amount) <= 0 || loading) 
                  ? 'var(--text-muted)' 
                  : 'white',
                fontSize: 16,
                fontWeight: 700,
                cursor: (!amount || parseFloat(amount) <= 0 || loading) 
                  ? 'not-allowed' 
                  : 'pointer',
                boxShadow: (!amount || parseFloat(amount) <= 0 || loading) 
                  ? 'none' 
                  : '0 4px 16px rgba(124, 58, 237, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              {loading 
                ? 'Gerando...' 
                : (isInvoice 
                  ? 'Gerar QR Code' 
                  : 'Gerar Link')}
            </button>
          </div>
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
              {parseFloat(amount).toFixed(2)} TRV
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
