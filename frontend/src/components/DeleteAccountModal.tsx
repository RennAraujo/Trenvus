import { useState } from 'react'
import { useI18n } from '../i18n'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (email: string, password: string) => void
  userEmail: string
  isLoading: boolean
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  isLoading
}: DeleteAccountModalProps) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!isOpen) return null

  const isEmailCorrect = email.toLowerCase() === userEmail.toLowerCase()
  const canConfirm = isEmailCorrect && password.length > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('account.delete.title')}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div style={{ 
            background: 'var(--color-danger-alpha-10)', 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid var(--color-danger-alpha-20)',
            marginBottom: 20
          }}>
            <div style={{ fontSize: 14, color: 'var(--color-danger)', marginBottom: 8 }}>
              ⚠️ {t('account.delete.warning')}
            </div>
            <ul style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, paddingLeft: 20 }}>
              <li>{t('account.delete.consequence1')}</li>
              <li>{t('account.delete.consequence2')}</li>
              <li>{t('account.delete.consequence3')}</li>
            </ul>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">
              {t('account.delete.emailLabel')} <strong>({userEmail})</strong>
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('account.delete.emailPlaceholder')}
              style={{ width: '100%' }}
              disabled={isLoading}
            />
            {!isEmailCorrect && email.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }}>
                {t('account.delete.emailMismatch')}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">{t('account.delete.passwordLabel')}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('account.delete.passwordPlaceholder')}
              style={{ width: '100%' }}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('actions.cancel')}
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onConfirm(email, password)}
            disabled={!canConfirm || isLoading}
            style={{ background: 'var(--color-danger)', color: 'white' }}
          >
            {isLoading ? (
              <span className="animate-pulse">{t('actions.processing')}</span>
            ) : (
              t('account.delete.confirmButton')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
