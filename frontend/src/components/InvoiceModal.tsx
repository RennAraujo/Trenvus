import { useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Helper functions for amount formatting
function groupInt(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatMoneyDigits(digits: string): { formatted: string; cents: bigint | null; plain: string | null } {
  const cleaned = digits.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (!cleaned) return { formatted: '', cents: null, plain: null }

  let cents: bigint
  try {
    cents = BigInt(cleaned)
  } catch {
    return { formatted: '', cents: null, plain: null }
  }
  if (cents <= 0n) return { formatted: '', cents: null, plain: null }

  const whole = cents / 100n
  const frac = cents % 100n
  const wholeRaw = whole.toString()
  const fracTwo = frac.toString().padStart(2, '0')

  const formatted = `${groupInt(wholeRaw)},${fracTwo}`
  const plain = `${wholeRaw}.${fracTwo}`
  return { formatted, cents, plain }
}

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

export function InvoiceModal({ isOpen, onClose }: InvoiceModalProps) {
  const auth = useAuth()
  const { t } = useI18n()
  const [view, setView] = useState<'menu' | 'invoice-form' | 'invoice-qr' | 'link-form' | 'link-qr'>('menu')
  const [amountDigits, setAmountDigits] = useState('')
  const [description, setDescription] = useState('')
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const amountInputRef = useRef<HTMLInputElement | null>(null)

  // Calculate formatted amount
  const amount = useMemo(() => formatMoneyDigits(amountDigits), [amountDigits])

  if (!isOpen) {
    // Reset state when modal is closed
    if (view !== 'menu') setView('menu')
    if (amountDigits !== '') setAmountDigits('')
    if (description !== '') setDescription('')
    if (qrPayload !== null) setQrPayload(null)
    if (copied !== false) setCopied(false)
    if (loading !== false) setLoading(false)
    return null
  }

  const handleCreateInvoice = async () => {
    if (!amount.plain) {
      alert(t('invoiceModal.validation.amountRequired'))
      return
    }
    const amountNum = parseFloat(amount.plain)
    if (amountNum > 1000000) {
      alert(t('invoiceModal.validation.amountMax'))
      return
    }
    
    setLoading(true)
    try {
      const token = await auth.getValidAccessToken()
      const response = await api.generateInvoice(token, amount.plain, 'TRV', description || t('invoiceModal.defaultDescriptionInvoice'))
      setQrPayload(response.qrPayload)
      setView('invoice-qr')
    } catch (err: any) {
      console.error(t('invoiceModal.errors.generateInvoice'), err)
      alert(err?.message || t('invoiceModal.errors.generateInvoice'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!amount.plain) {
      alert(t('invoiceModal.validation.amountRequired'))
      return
    }
    const amountNum = parseFloat(amount.plain)
    if (amountNum > 1000000) {
      alert(t('invoiceModal.validation.amountMax'))
      return
    }
    
    setLoading(true)
    try {
      const token = await auth.getValidAccessToken()
      const response = await api.generateInvoice(token, amount.plain, 'TRV', description || t('invoiceModal.defaultDescriptionLink'))
      setQrPayload(response.qrPayload)
      setView('link-qr')
    } catch (err: any) {
      console.error(t('invoiceModal.errors.generateLink'), err)
      alert(err?.message || t('invoiceModal.errors.generateLink'))
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!qrPayload) return
    
    const baseUrl = window.location.origin
    const link = `${baseUrl}/pay?invoice=${encodeURIComponent(qrPayload)}`
    
    try {
      // Try modern clipboard API first (requires HTTPS or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link)
      } else {
        // Fallback for HTTP contexts
        const textArea = document.createElement('textarea')
        textArea.value = link
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (!successful) {
          throw new Error('execCommand failed')
        }
      }
      
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Show the link in a prompt as last resort
      window.prompt(t('invoiceModal.copyFallback'), link)
    }
  }

  const share = () => {
    if (navigator.share && qrPayload) {
      navigator.share({
        title: t('invoiceModal.share.title'),
        text: t('invoiceModal.share.text', { amount: amount.formatted }),
        url: `${window.location.origin}/pay?invoice=${encodeURIComponent(qrPayload)}`
      })
    } else {
      copyLink()
    }
  }

  const handleClose = () => {
    onClose()
  }

  // Render Menu
  if (view === 'menu') {
    return (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}
        onClick={handleClose}
      >
        <div 
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#1a1a25',
            borderRadius: 20,
            border: '2px solid #2a2a3c',
            overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 16px',
            borderBottom: '1px solid #2a2a3c'
          }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>
                {t('invoiceModal.menu.title')}
              </h2>
              <p style={{ fontSize: 13, color: '#717190', margin: 0 }}>
                {t('invoiceModal.menu.subtitle')}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: '#2a2a3c',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a0a0b8'
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Options */}
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setView('invoice-form')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: 14,
                border: '2px solid #2a2a3c',
                background: '#12121a',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <InvoiceIcon />
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, color: '#fff' }}>
                  {t('invoiceModal.option.qr.title')}
                </div>
                <div style={{ fontSize: 12, color: '#717190' }}>
                  {t('invoiceModal.option.qr.subtitle')}
                </div>
              </div>
              
              <ArrowRightIcon />
            </button>

            <button
              onClick={() => setView('link-form')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: 14,
                border: '2px solid #2a2a3c',
                background: '#12121a',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <LinkIcon />
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, color: '#fff' }}>
                  {t('invoiceModal.option.link.title')}
                </div>
                <div style={{ fontSize: 12, color: '#717190' }}>
                  {t('invoiceModal.option.link.subtitle')}
                </div>
              </div>
              
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Form
  if (view === 'invoice-form' || view === 'link-form') {
    const isInvoice = view === 'invoice-form'
    return (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}
        onClick={handleClose}
      >
        <div 
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#1a1a25',
            borderRadius: 20,
            border: '2px solid #2a2a3c',
            overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid #2a2a3c',
            background: '#12121a'
          }}>
            <button
              onClick={() => setView('menu')}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: '#1a1a25',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a0a0b8'
              }}
            >
              <BackIcon />
            </button>
            
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>
              {isInvoice ? t('invoiceModal.form.qr.title') : t('invoiceModal.form.link.title')}
            </h2>
          </div>

          {/* Form */}
          <div style={{ padding: 20 }}>
            {/* Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 8,
                color: '#717190',
                textTransform: 'uppercase'
              }}>
                {t('invoiceModal.form.amountLabel')}
              </label>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: '#12121a',
                borderRadius: 12,
                border: '2px solid #2a2a3c'
              }}>
                <span style={{ 
                  fontSize: 28, 
                  fontWeight: 800,
                  color: '#a855f7'
                }}>₮</span>
                
                <input
                  ref={amountInputRef}
                  value={amount.formatted}
                  onFocus={() => {
                    const el = amountInputRef.current
                    if (!el) return
                    el.setSelectionRange(el.value.length, el.value.length)
                  }}
                  onClick={() => {
                    const el = amountInputRef.current
                    if (!el) return
                    el.setSelectionRange(el.value.length, el.value.length)
                  }}
                  onChange={(e) => {
                    const nextDigits = e.target.value.replace(/\D/g, '')
                    setAmountDigits(nextDigits)
                    requestAnimationFrame(() => {
                      const el = amountInputRef.current
                      if (!el) return
                      el.setSelectionRange(el.value.length, el.value.length)
                    })
                  }}
                  inputMode="numeric"
                  placeholder={t('money.placeholder')}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 24,
                    fontWeight: 700,
                    outline: 'none',
                    color: '#fff'
                  }}
                />
                
                <span style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: '#2a2a3c',
                  color: '#717190',
                  fontSize: 13,
                  fontWeight: 700
                }}>
                  TRV
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 8,
                color: '#717190',
                textTransform: 'uppercase'
              }}>
                {t('invoiceModal.form.descriptionLabel')}
              </label>
              
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isInvoice ? t('invoiceModal.form.descriptionPlaceholderQr') : t('invoiceModal.form.descriptionPlaceholderLink')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#12121a',
                  borderRadius: 12,
                  border: '2px solid #2a2a3c',
                  fontSize: 15,
                  outline: 'none',
                  color: '#fff'
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #2a2a3c',
            background: '#12121a'
          }}>
            <button
              onClick={isInvoice ? handleCreateInvoice : handleCreateLink}
              disabled={!amount.plain || loading}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 12,
                border: 'none',
                background: (!amount.plain || loading) ? '#2a2a3c' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: (!amount.plain || loading) ? 'not-allowed' : 'pointer',
                opacity: (!amount.plain || loading) ? 0.6 : 1
              }}
            >
              {loading ? t('invoiceModal.form.generating') : (isInvoice ? t('invoiceModal.form.generateQr') : t('invoiceModal.form.generateLink'))}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render QR
  if (view === 'invoice-qr' || view === 'link-qr') {
    const isInvoice = view === 'invoice-qr'
    return (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}
        onClick={handleClose}
      >
        <div 
          style={{
            width: '100%',
            maxWidth: 360,
            background: '#1a1a25',
            borderRadius: 20,
            border: '2px solid #2a2a3c',
            overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #2a2a3c',
            background: '#12121a'
          }}>
            <button
              onClick={() => setView(isInvoice ? 'invoice-form' : 'link-form')}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: '#1a1a25',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a0a0b8'
              }}
            >
              <BackIcon />
            </button>
            
            <button
              onClick={handleClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: '#1a1a25',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a0a0b8'
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Content */}
          <div style={{ 
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* QR Code */}
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              marginBottom: 20
            }}>
              {qrPayload && (
                <div style={{ position: 'relative', lineHeight: 0 }}>
                  <QRCodeSVG 
                    value={qrPayload}
                    size={200}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    imageSettings={{
                      src: '/logo-qr.png',
                      height: 44,
                      width: 44,
                      excavate: false,
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 46,
                    height: 46,
                    background: 'white',
                    borderRadius: '50%',
                    zIndex: -1,
                    border: '2px solid black',
                  }}/>
                </div>
              )}
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#a855f7'
              }}>
                {amount.formatted || t('money.placeholder')} TRV
              </div>
              
              {description && (
                <div style={{ 
                  marginTop: 6, 
                  color: '#717190',
                  fontSize: 13,
                  maxWidth: 260,
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
              gap: 10,
              width: '100%',
              marginTop: 20
            }}>
              <button
                onClick={copyLink}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid #2a2a3c',
                  background: '#12121a',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? t('invoiceModal.qr.copied') : t('invoiceModal.qr.copy')}
              </button>
              
              <button
                onClick={share}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <ShareIcon />
                {t('invoiceModal.qr.share')}
              </button>
            </div>

            {/* Create New */}
            <button
              onClick={() => setView('menu')}
              style={{
                marginTop: 16,
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: '#717190',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              {t('invoiceModal.qr.createNew')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
