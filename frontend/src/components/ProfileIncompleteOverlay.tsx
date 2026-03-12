import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'

const LockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

export function ProfileIncompleteOverlay() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 420,
      gap: 20,
      textAlign: 'center',
      padding: '48px 24px',
    }}>
      <div style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'rgba(245, 158, 11, 0.12)',
        color: '#f59e0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <LockIcon />
      </div>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: 'var(--text-primary)' }}>
          {t('profile.incomplete.title')}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
          {t('profile.incomplete.description')}
        </p>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => navigate('/app/account')}
        style={{ marginTop: 8 }}
      >
        {t('profile.incomplete.action')}
      </button>
    </div>
  )
}
