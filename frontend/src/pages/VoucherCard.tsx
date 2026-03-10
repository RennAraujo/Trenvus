import { useEffect, useState } from 'react'
import { api, type VoucherResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { QRCodeSVG } from 'qrcode.react'

export function VoucherCard() {
  const auth = useAuth()
  const { t } = useI18n()
  const [voucher, setVoucher] = useState<VoucherResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  async function loadVoucher() {
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getMyVoucher(token)
      setVoucher(data)
    } catch (err: any) {
      if (err?.status === 404) {
        setVoucher(null)
      } else {
        setError(err?.message || 'Failed to load voucher')
      }
    } finally {
      setLoading(false)
    }
  }

  async function generateVoucher() {
    setGenerating(true)
    setError(null)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.generateVoucher(token)
      setVoucher(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to generate voucher')
    } finally {
      setGenerating(false)
    }
  }

  async function deactivateVoucher() {
    if (!confirm(t('voucher.confirmDeactivate'))) return
    
    try {
      const token = await auth.getValidAccessToken()
      await api.deactivateVoucher(token)
      setVoucher(null)
    } catch (err: any) {
      setError(err?.message || 'Failed to deactivate voucher')
    }
  }

  useEffect(() => {
    void loadVoucher()
  }, [])

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div className="animate-pulse">{t('actions.loading')}</div>
      </div>
    )
  }

  const baseUrl = window.location.origin
  const voucherUrl = voucher ? `${baseUrl}/voucher/view/${voucher.code}` : ''

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{t('voucher.title')}</h1>
        <p className="page-subtitle">{t('voucher.subtitle')}</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!voucher ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: 20,
            background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
          </div>
          <h3 style={{ marginBottom: 12 }}>{t('voucher.noVoucher')}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            {t('voucher.noVoucherDesc')}
          </p>
          <button 
            className="btn btn-primary btn-lg" 
            onClick={generateVoucher}
            disabled={generating}
          >
            {generating ? (
              <span className="animate-pulse">{t('actions.processing')}</span>
            ) : (
              t('voucher.generateButton')
            )}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Voucher Card */}
          <div 
            className="card"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow effect */}
            <div style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}/>

            <div style={{ position: 'relative', zIndex: 1, padding: '32px 24px' }}>
              {/* Logo - centralizado acima do QR code */}
              <div style={{ 
                textAlign: 'center',
                marginBottom: 32,
              }}>
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

              {/* QR Code */}
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
              }}>
                {/* QR Code Container com design premium */}
                <div style={{
                  background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.2) 0%, rgba(234, 29, 44, 0.1) 100%)',
                  padding: 28,
                  borderRadius: 28,
                  boxShadow: '0 12px 40px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                  border: '2px solid rgba(124, 58, 237, 0.5)',
                  position: 'relative',
                }}>
                  {/* Glow effect */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 160,
                    height: 160,
                    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.5) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    filter: 'blur(20px)',
                  }}/>
                  
                  {/* QR Code branco com logo */}
                  <div style={{
                    background: 'white',
                    padding: 24,
                    borderRadius: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}>
                    <QRCodeSVG 
                      value={voucherUrl}
                      size={220}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#1a1a2e"
                      imageSettings={{
                        src: '/logo-qr.png',
                        height: 45,
                        width: 45,
                        excavate: true,
                      }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ 
                    fontSize: 13, 
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    fontWeight: 500,
                  }}>
                    {t('voucher.scanToView')}
                  </p>
                  <code style={{
                    fontSize: 13,
                    color: 'white',
                    background: 'rgba(124, 58, 237, 0.25)',
                    padding: '10px 20px',
                    borderRadius: 10,
                    wordBreak: 'break-all',
                    display: 'inline-block',
                    fontFamily: 'monospace',
                  }}>
                    {voucher.code}
                  </code>
                </div>

                <div style={{ 
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  marginTop: 8,
                }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      navigator.clipboard.writeText(voucherUrl)
                      alert(t('voucher.copied'))
                    }}
                  >
                    {t('voucher.copyLink')}
                  </button>
                  <button 
                    className="btn btn-ghost"
                    onClick={deactivateVoucher}
                    style={{ color: 'var(--color-danger)' }}
                  >
                    {t('voucher.deactivate')}
                  </button>
                </div>
              </div>

              {/* Expires at */}
              {voucher.expiresAt && (
                <p style={{ 
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 28,
                }}>
                  {t('voucher.expiresAt')}: {new Date(voucher.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="card" style={{ background: 'var(--bg-subtle)' }}>
            <h4 style={{ marginBottom: 16 }}>{t('voucher.howToUse')}</h4>
            <ol style={{ paddingLeft: 20, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              <li>{t('voucher.step1')}</li>
              <li>{t('voucher.step2')}</li>
              <li>{t('voucher.step3')}</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
