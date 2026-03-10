import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, type WalletResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="M12 5v14"/>
  </svg>
)

const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6h13"/>
    <path d="M8 12h13"/>
    <path d="M8 18h13"/>
    <path d="M3 6h.01"/>
    <path d="M3 12h.01"/>
    <path d="M3 18h.01"/>
  </svg>
)

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
)

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
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

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  amount: string
}

export function InvoicesReceive() {
  const auth = useAuth()
  const { t, locale } = useI18n()
  
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001')
  const [customer, setCustomer] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', quantity: 1, amount: '' }])
  const [currency] = useState<'USD' | 'TRV'>('USD')
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  })
  
  // UI state
  const [step, setStep] = useState<'form' | 'review' | 'qr' | 'success'>('form')
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [_wallet, setWallet] = useState<WalletResponse | null>(null)
  const [copied, setCopied] = useState(false)

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

  // Generate invoice number on mount
  useEffect(() => {
    const random = Math.floor(Math.random() * 900) + 100
    setInvoiceNumber(`INV-${random}`)
  }, [])

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0
      return sum + (amount * item.quantity)
    }, 0)
  }

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, amount: '' }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  async function generateQr() {
    const total = calculateTotal()
    const description = items.map(i => i.description).filter(Boolean).join(', ') || 'Invoice payment'
    
    try {
      const token = await auth.getValidAccessToken()
      const response = await api.generateInvoice(token, total.toFixed(2), currency, description)
      setQrPayload(response.qrPayload)
      setStep('qr')
    } catch (err: any) {
      console.error('Failed to generate QR', err)
    }
  }

  function copyLink() {
    if (qrPayload) {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/pay?invoice=${encodeURIComponent(qrPayload)}`
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function shareInvoice() {
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoiceNumber}`,
        text: `Payment request for ${calculateTotal().toFixed(2)} ${currency}`,
        url: `${window.location.origin}/pay?invoice=${encodeURIComponent(qrPayload || '')}`
      })
    } else {
      copyLink()
    }
  }

  function reset() {
    setStep('form')
    setQrPayload(null)
    setCustomer('')
    setItems([{ id: '1', description: '', quantity: 1, amount: '' }])
    const random = Math.floor(Math.random() * 900) + 100
    setInvoiceNumber(`INV-${random}`)
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Currency flag
  const CurrencyFlag = () => (
    <span style={{ fontSize: 20 }}>
      {currency === 'USD' ? '🇺🇸' : '🔷'}
    </span>
  )

  if (step === 'qr' && qrPayload) {
    const total = calculateTotal()
    return (
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 24 
        }}>
          <button 
            onClick={() => setStep('review')}
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
          <div style={{
            padding: '8px 16px',
            background: 'var(--bg-elevated)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 500
          }}>
            <CurrencyFlag />
            {currency}
          </div>
        </div>

        {/* Invoice Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}>
            {invoiceNumber}
            <button style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--bg-elevated)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <EditIcon />
            </button>
          </h1>
        </div>

        {/* QR Code */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <QRCodeSVG 
              value={qrPayload}
              size={280}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              fontSize: 14, 
              color: 'var(--text-secondary)',
              marginBottom: 8
            }}>
              {t('invoice.scanToPay') || 'Scan to pay'}
            </p>
            <div style={{
              fontSize: 36,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}>
              {total.toFixed(2)} {currency}
            </div>
          </div>

          {/* Action Buttons */}
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
                padding: '14px 24px',
                borderRadius: 12,
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
              {copied ? <CheckIcon /> : <DownloadIcon />}
              {copied ? (t('actions.copied') || 'Copied!') : (t('invoice.copyLink') || 'Copy link')}
            </button>
            
            <button
              onClick={shareInvoice}
              style={{
                flex: 1,
                padding: '14px 24px',
                borderRadius: 12,
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
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer',
              marginTop: 16
            }}
          >
            {t('invoice.createNew') || 'Create new invoice'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'review') {
    const total = calculateTotal()
    return (
      <div className="animate-fade-in">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            {t('actions.back') || 'Back'}
          </button>
          
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>
            {invoiceNumber}
            <button style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--bg-elevated)',
              cursor: 'pointer',
              marginLeft: 8
            }}>
              <EditIcon />
            </button>
          </h1>
        </div>

        {/* Currency Selector */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 24 
        }}>
          <div style={{
            padding: '8px 16px',
            background: 'var(--bg-elevated)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 500
          }}>
            <CurrencyFlag />
            {currency}
          </div>
        </div>

        {/* Customer Card */}
        <div style={{
          border: '2px dashed var(--border-default)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {customer ? (
                <span style={{ fontSize: 18, fontWeight: 600 }}>{customer.charAt(0).toUpperCase()}</span>
              ) : (
                <UserIcon />
              )}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {customer || (t('invoice.customer') || 'Customer')}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {customer 
                  ? (t('invoice.customerAdded') || 'Customer added') 
                  : (t('invoice.whoInvoiceFor') || 'Who the invoice is for')}
              </div>
            </div>
            
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>

        {/* Items Card */}
        <div style={{
          border: '2px dashed var(--border-default)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <ListIcon />
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PlusIcon />
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {t('invoice.items') || 'Items'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {items.some(i => i.description) 
                  ? `${items.filter(i => i.description).length} items` 
                  : (t('invoice.whatYouSold') || 'What you sold')}
              </div>
            </div>
            
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 0',
          borderBottom: '1px solid var(--border-default)'
        }}>
          <CameraIcon />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{t('invoice.paymentMethods') || 'Payment methods'}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {t('invoice.payWithTrv') || 'Pay with TRV via QR code'}
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>

        {/* Dates */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 0',
          borderBottom: '1px solid var(--border-default)'
        }}>
          <CalendarIcon />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{t('invoice.issued') || 'Issued'}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{formatDate(issuedDate)}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 0',
          marginBottom: 24
        }}>
          <ClockIcon />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{t('invoice.due') || 'Due'}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{formatDate(dueDate)}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>

        {/* Total */}
        <div style={{
          textAlign: 'center',
          marginBottom: 24,
          padding: 16,
          background: 'var(--bg-elevated)',
          borderRadius: 12
        }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {t('invoice.amountDueBy', { date: formatDate(dueDate) }) || `Amount due by ${formatDate(dueDate)}`}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)' }}>
            {total.toFixed(2)} {currency}
          </div>
        </div>

        {/* Review Button */}
        <button
          onClick={generateQr}
          disabled={total <= 0}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: 12,
            border: 'none',
            background: total > 0 ? 'var(--color-primary)' : 'var(--bg-elevated)',
            color: total > 0 ? 'white' : 'var(--text-muted)',
            fontSize: 16,
            fontWeight: 600,
            cursor: total > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          {t('invoice.generateQr') || 'Generate QR Code'}
        </button>
      </div>
    )
  }

  // Form Step
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 24 
      }}>
        <button 
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
        
        <div style={{
          padding: '8px 16px',
          background: 'var(--bg-elevated)',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 500,
          cursor: 'pointer'
        }}
        >
          <CurrencyFlag />
          {currency}
        </div>
      </div>

      {/* Invoice Number */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          {invoiceNumber}
          <button style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--bg-elevated)',
            cursor: 'pointer'
          }}>
            <EditIcon />
          </button>
        </h1>
      </div>

      {/* Customer */}
      <div style={{
        border: '2px dashed var(--border-default)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16
      }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 16,
          cursor: 'pointer'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0
          }}>
            <UserIcon />
            <div style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PlusIcon />
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {t('invoice.customer') || 'Customer'}
            </div>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder={t('invoice.whoInvoiceFor') || 'Who the invoice is for'}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                fontSize: 14,
                color: 'var(--text-secondary)',
                outline: 'none'
              }}
            />
          </div>
          
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </label>
      </div>

      {/* Items */}
      <div style={{
        border: '2px dashed var(--border-default)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0
          }}>
            <ListIcon />
            <div style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PlusIcon />
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>
              {t('invoice.items') || 'Items'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {t('invoice.whatYouSold') || 'What you sold'}
            </div>
          </div>
        </div>

        {items.map((item, index) => (
          <div key={item.id} style={{ 
            display: 'grid', 
            gap: 12,
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: index < items.length - 1 ? '1px solid var(--border-default)' : 'none'
          }}>
            <input
              type="text"
              value={item.description}
              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              placeholder={t('invoice.itemDescription') || 'Item description'}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                fontSize: 15
              }}
            />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                placeholder="Qty"
                min="1"
                style={{
                  width: 80,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-elevated)',
                  fontSize: 15
                }}
              />
              
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}>
                  {currency === 'USD' ? '$' : '₮'}
                </span>
                <input
                  type="text"
                  value={item.amount}
                  onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 32px',
                    borderRadius: 12,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-elevated)',
                    fontSize: 15,
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
              
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: 'none',
                    background: 'var(--bg-elevated)',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addItem}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '1px dashed var(--border-default)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <PlusIcon />
          {t('invoice.addItem') || 'Add item'}
        </button>
      </div>

      {/* Payment Methods */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 0',
        borderBottom: '1px solid var(--border-default)'
      }}>
        <CameraIcon />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{t('invoice.paymentMethods') || 'Payment methods'}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {t('invoice.payWithTrv') || 'Pay with TRV via QR code'}
          </div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>

      {/* Dates */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 0',
        borderBottom: '1px solid var(--border-default)'
      }}>
        <CalendarIcon />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{t('invoice.issued') || 'Issued'}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{formatDate(issuedDate)}</div>
        </div>
        <input
          type="date"
          value={issuedDate}
          onChange={(e) => setIssuedDate(e.target.value)}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1
          }}
        />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 0',
        marginBottom: 24
      }}>
        <ClockIcon />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{t('invoice.due') || 'Due'}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{formatDate(dueDate)}</div>
        </div>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1
          }}
        />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>

      {/* Total & Review */}
      <div style={{
        textAlign: 'center',
        marginBottom: 16,
        padding: 16,
        background: 'var(--bg-elevated)',
        borderRadius: 12
      }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {t('invoice.amountDueBy', { date: formatDate(dueDate) }) || `Amount due by ${formatDate(dueDate)}`}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-success)' }}>
          {calculateTotal().toFixed(2)} {currency}
        </div>
      </div>

      {/* Review Button */}
      <button
        onClick={() => setStep('review')}
        disabled={calculateTotal() <= 0}
        style={{
          width: '100%',
          padding: '16px 24px',
          borderRadius: 12,
          border: 'none',
          background: calculateTotal() > 0 ? 'var(--color-primary)' : 'var(--bg-elevated)',
          color: calculateTotal() > 0 ? 'white' : 'var(--text-muted)',
          fontSize: 16,
          fontWeight: 600,
          cursor: calculateTotal() > 0 ? 'pointer' : 'not-allowed'
        }}
      >
        {t('invoice.review') || 'Review'}
      </button>
    </div>
  )
}
