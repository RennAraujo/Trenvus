import { useEffect, useState } from 'react'
import { api, formatUsd, type VoucherResponse } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import brandLogo from '../assets/brand-mark.png'

// QRCode library mock - we'll generate a simple SVG QR code
function generateQRCodeSVG(data: string, size = 200): string {
  // Simple QR code representation (in production, use a library like qrcode.react)
  const cells = 25
  const cellSize = size / cells
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${size}" height="${size}" fill="white"/>`
  
  // Generate pattern based on data hash
  const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  for (let row = 0; row < cells; row++) {
    for (let col = 0; col < cells; col++) {
      // Position markers (corners)
      const isPositionMarker = 
        (row < 7 && col < 7) || 
        (row < 7 && col >= cells - 7) || 
        (row >= cells - 7 && col < 7)
      
      if (isPositionMarker) {
        // Draw position marker pattern
        if ((row === 0 || row === 6 || col === 0 || col === 6) ||
            (row >= 2 && row <= 4 && col >= 2 && col <= 4)) {
          svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1a1a2e"/>`
        }
      } else {
        // Random data pattern based on hash
        const shouldFill = ((hash + row * 13 + col * 7) % 2) === 1
        if (shouldFill) {
          svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1a1a2e"/>`
        }
      }
    }
  }
  
  svg += '</svg>'
  return svg
}

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
  const qrSvg = voucher ? generateQRCodeSVG(voucherUrl) : ''

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
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
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

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <img src={brandLogo} alt="TRENVUS" style={{ height: 32 }} />
                <span style={{ 
                  fontSize: 20, 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
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
                <div style={{
                  background: 'white',
                  padding: 16,
                  borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    style={{ width: 200, height: 200 }}
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ 
                    fontSize: 12, 
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}>
                    {t('voucher.scanToView')}
                  </p>
                  <code style={{
                    fontSize: 14,
                    color: 'white',
                    background: 'rgba(124, 58, 237, 0.2)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    wordBreak: 'break-all',
                  }}>
                    {voucher.code}
                  </code>
                </div>

                <div style={{ 
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
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
                  marginTop: 24,
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
