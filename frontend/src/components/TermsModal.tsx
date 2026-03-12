import { useI18n } from '../i18n'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function TermsModal({ isOpen, onClose }: Props) {
  const { t } = useI18n()
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card, #18182a)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          maxWidth: 620,
          width: '100%',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t('terms.title')}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: '4px 8px', fontSize: 18, lineHeight: 1,
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, lineHeight: 1.7 }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20, fontStyle: 'italic' }}>
            {t('terms.lastUpdated')}
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            {t('terms.section1.title')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
            {t('terms.section1.body')}
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            {t('terms.section2.title')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
            {t('terms.section2.body')}
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            {t('terms.section3.title')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
            {t('terms.section3.body')}
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            {t('terms.section4.title')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
            {t('terms.section4.body')}
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            {t('terms.section5.title')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>
            {t('terms.section5.body')}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <button className="btn btn-primary" onClick={onClose}>
            {t('terms.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
