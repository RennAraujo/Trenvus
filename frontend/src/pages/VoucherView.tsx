import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, formatUsd, type VoucherProfileResponse } from '../api'
import { useI18n } from '../i18n'
import brandLogo from '../assets/brand-mark.png'

// Icons
const VerifiedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 16 10"/><path d="m9 12 2 2 4-4"/>
  </svg>
)

const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

const UserIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
)

export function VoucherView() {
  const { code } = useParams<{ code: string }>()
  const { t } = useI18n()
  const [profile, setProfile] = useState<VoucherProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) {
      setError('Invalid voucher code')
      setLoading(false)
      return
    }

    async function loadProfile() {
      try {
        const data = await api.getVoucherProfile(code)
        setProfile(data)
      } catch (err: any) {
        setError(err?.message || 'Voucher not found or expired')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [code])

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      }}>
        <div className="animate-pulse" style={{ color: 'white' }}>{t('actions.loading')}</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%',
            background: 'rgba(220, 53, 69, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
          </div>
          <h2 style={{ color: 'white', marginBottom: 12 }}>{t('voucher.invalidTitle')}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>{t('voucher.invalidDesc')}</p>
          <Link to="/" className="btn btn-primary">
            <ArrowLeftIcon />
            {t('actions.backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      padding: '24px 16px',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Back button */}
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8,
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <ArrowLeftIcon />
          {t('actions.back')}
        </Link>

        {/* Voucher Card */}
        <div 
          style={{
            background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.15) 0%, rgba(234, 29, 44, 0.1) 100%)',
            borderRadius: 24,
            border: '1px solid rgba(124, 58, 237, 0.3)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Glow effect */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>

          {/* Header with logo */}
          <div style={{ 
            padding: '24px 24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={brandLogo} alt="TRENVUS" style={{ height: 28 }} />
              <span style={{ 
                fontSize: 16, 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                TRENVUS
              </span>
            </div>

            {profile.verified && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(25, 135, 84, 0.2)',
                color: '#28a745',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}>
                <VerifiedIcon />
                {t('voucher.verified')}
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div style={{ 
            padding: '32px 24px',
            textAlign: 'center',
          }}>
            {/* Avatar */}
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              margin: '0 auto 20px',
              background: profile.avatarDataUrl ? 'transparent' : 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid rgba(124, 58, 237, 0.5)',
              overflow: 'hidden',
            }}>
              {profile.avatarDataUrl ? (
                <img 
                  src={profile.avatarDataUrl} 
                  alt={profile.nickname}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: 'white', fontSize: 36, fontWeight: 600 }}>
                  {(profile.nickname || profile.email).charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Nickname */}
            <h1 style={{ 
              fontSize: 24, 
              fontWeight: 700,
              color: 'white',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              {profile.nickname || profile.email.split('@')[0]}
              {profile.verified && (
                <span style={{ color: '#28a745' }}><VerifiedIcon /></span>
              )}
            </h1>

            {/* User ID */}
            <p style={{ 
              fontSize: 14, 
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 24,
            }}>
              ID: {profile.userId}
            </p>

            {/* Divider */}
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.5), transparent)',
              margin: '24px 0',
            }}/>

            {/* Balance Card */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginBottom: 12,
              }}>
                <WalletIcon />
                <span style={{ 
                  fontSize: 14, 
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  {t('voucher.balance')}
                </span>
              </div>

              <div style={{
                fontSize: 36,
                fontWeight: 700,
                color: 'white',
                marginBottom: 4,
              }}>
                {formatUsd(profile.trvBalanceCents)}
              </div>

              <div style={{
                fontSize: 16,
                color: '#28a745',
                fontWeight: 600,
              }}>
                TRV
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 24px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ 
              fontSize: 12, 
              color: 'rgba(255,255,255,0.4)',
            }}>
              {t('voucher.poweredBy')}
            </span>

            <Link 
              to="/register"
              className="btn btn-primary btn-sm"
            >
              {t('voucher.createAccount')}
            </Link>
          </div>
        </div>

        {/* Security Note */}
        <p style={{ 
          textAlign: 'center',
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          marginTop: 24,
        }}>
          {t('voucher.securityNote')}
        </p>
      </div>
    </div>
  )
}
