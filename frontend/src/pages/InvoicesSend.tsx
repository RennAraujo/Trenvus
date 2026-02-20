import { useMemo, useState } from 'react'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
)

const DollarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const QrIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21h.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>
  </svg>
)



const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
)

function demoQrBackground(seed: string): string {
  let x = 0
  for (let i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) >>> 0
  const a = 30 + (x % 70)
  const b = 30 + ((x >>> 8) % 70)
  const c = 30 + ((x >>> 16) % 70)
  return `repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0, rgba(255,255,255,0.10) ${a}px, rgba(255,255,255,0.00) ${a}px, rgba(255,255,255,0.00) ${a + 10}px),
repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0, rgba(255,255,255,0.10) ${b}px, rgba(255,255,255,0.00) ${b}px, rgba(255,255,255,0.00) ${b + 12}px),
radial-gradient(circle at 20% 20%, rgba(25,193,201,0.20), transparent ${c}%)`
}

export function InvoicesSend() {
  const auth = useAuth()
  const { t } = useI18n()

  const [amount, setAmount] = useState('10.00')
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })
  const [showQr, setShowQr] = useState(false)

  const payload = useMemo(() => {
    return {
      type: 'INVOICE',
      toEmail: auth.userEmail || null,
      currency: 'USD',
      amount,
      dueDate,
    }
  }, [amount, auth.userEmail, dueDate])

  const bg = useMemo(() => demoQrBackground(JSON.stringify(payload)), [payload])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('invoices.send.title')}</h1>
          <p className="page-subtitle">{t('invoices.send.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: 24 }}>
        {/* Form Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'var(--color-primary-alpha-10)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SendIcon />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('invoices.send.formTitle')}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Create a new payment request</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="field">
                <label className="field-label">{t('invoices.send.amount')}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <DollarIcon />
                  </span>
                  <input 
                    className="input font-mono" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    inputMode="decimal"
                    placeholder="0.00"
                    style={{ paddingLeft: 44 }}
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: 20 }}>
                <label className="field-label">{t('invoices.send.dueDate')}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <CalendarIcon />
                  </span>
                  <input 
                    className="input" 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ paddingLeft: 44 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setShowQr(true)}
                  disabled={!amount.trim() || !dueDate.trim()}
                >
                  <QrIcon />
                  {t('invoices.send.generateDemo')}
                </button>
                {showQr && (
                  <button className="btn btn-ghost" type="button" onClick={() => setShowQr(false)}>
                    <EyeOffIcon />
                    {t('actions.hide')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* QR Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <QrIcon />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('invoices.send.qrTitle')}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('invoices.send.qrSubtitle')}</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            {showQr ? (
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: bg,
                    flexShrink: 0,
                    border: '1px solid var(--border-default)'
                  }}
                />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="text-xs font-semibold text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 8 }}>
                    {t('invoices.send.payload')}
                  </div>
                  <pre
                    className="font-mono text-xs"
                    style={{
                      margin: 0,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      padding: 12,
                      borderRadius: 8,
                      overflow: 'auto',
                      maxHeight: 200,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                  <QrIcon />
                </div>
                <p className="empty-state-desc">{t('invoices.send.qrEmpty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
