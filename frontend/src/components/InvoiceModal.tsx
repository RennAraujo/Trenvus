import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
)

const InvoiceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" x2="8" y1="13" y2="13"/>
    <line x1="16" x2="8" y1="17" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const LinkIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
)

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
  </svg>
)

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
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
      <div className="modal-overlay" onClick={handleClose}>
        <div 
          className="modal-content" 
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: 420,
            padding: 0,
            overflow: 'hidden',
            border: '2px solid var(--border-default)',
            boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 24px 16px',
            borderBottom: '1px solid var(--border-default)',
            background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-primary) 100%)'
          }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px 0' }}>
                Receber Pagamento
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                Escolha como quer receber TRV
              </p>
            </div>
            <button
              onClick={handleClose}
              className="btn btn-icon btn-secondary"
              style={{ width: 36, height: 36 }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Options */}
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                transition: 'all 0.2s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-alpha-20)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <InvoiceIcon />
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  QR Code
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  O pagador escaneia com a câmera
                </div>
              </div>
              
              <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                <ArrowRightIcon />
              </div>
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
                transition: 'all 0.2s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-success)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <LinkIcon />
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  Link de Pagamento
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Copie e envie por WhatsApp ou email
                </div>
              </div>
              
              <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                <ArrowRightIcon />
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Form Step (Invoice or Link)
  if (step === 'invoice-form' || step === 'link-form') {
    const isInvoice = step === 'invoice-form'
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div 
          className="modal-content" 
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: 440,
            padding: 0,
            overflow: 'hidden',
            border: '2px solid var(--border-default)',
            boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
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
              className="btn btn-icon btn-secondary"
              style={{ width: 36, height: 36 }}
            >
              <BackIcon />
            </button>
            
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
              {isInvoice ? 'QR Code' : 'Link de Pagamento'}
            </h2>
          </div>

          {/* Form */}
          <div style={{ padding: 24 }}>
            {/* Amount */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Valor
              </label>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                background: 'var(--bg-elevated)',
                borderRadius: 14,
                border: '2px solid var(--border-default)',
                transition: 'all 0.2s'
              }}>
                <span style={{ 
                  fontSize: 24, 
                  fontWeight: 700,
                  color: 'var(--color-primary)'
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
                    fontSize: 28,
                    fontWeight: 700,
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)'
                  }}
                />
                
                <span style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 700
                }}>
                  TRV
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 8 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Descrição (opcional)
              </label>
              
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isInvoice ? "Ex: Pagamento de serviço" : "Ex: Doação"}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 14,
                  border: '2px solid var(--border-default)',
                  fontSize: 15,
                  outline: 'none',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
              />
            </div>
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
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                opacity: (!amount || parseFloat(amount) <= 0 || loading) ? 0.5 : 1,
                cursor: (!amount || parseFloat(amount) <= 0 || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Gerando...' : (isInvoice ? 'Gerar QR Code' : 'Gerar Link')}
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
      <div className="modal-overlay" onClick={handleClose}>
        <div 
          className="modal-content" 
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: 400,
            padding: 0,
            overflow: 'hidden',
            border: '2px solid var(--border-default)',
            boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)'
          }}>
            <button
              onClick={() => setStep(isInvoice ? 'invoice-form' : 'link-form')}
              className="btn btn-icon btn-secondary"
              style={{ width: 36, height: 36 }}
            >
              <BackIcon />
            </button>
            
            <button
              onClick={handleClose}
              className="btn btn-icon btn-secondary"
              style={{ width: 36, height: 36 }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Content */}
          <div style={{ 
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* QR Code */}
            <div style={{
              background: 'white',
              padding: 24,
              borderRadius: 20,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              marginBottom: 24
            }}>
              {qrPayload && (
                <QRCodeSVG 
                  value={qrPayload}
                  size={200}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              )}
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{
                fontSize: 32,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {parseFloat(amount || '0').toFixed(2)} TRV
              </div>
              
              {description && (
                <div style={{ 
                  marginTop: 8, 
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  maxWidth: 280,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {description}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: 12,
              width: '100%',
              marginTop: 24
            }}>
              <button
                onClick={copyLink}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
              
              <button
                onClick={share}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <ShareIcon />
                Compartilhar
              </button>
            </div>

            {/* Create New */}
            <button
              onClick={reset}
              style={{
                marginTop: 20,
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Criar novo
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
