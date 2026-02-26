import { useState } from 'react'
import { useI18n } from '../i18n'

interface TransferConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  recipient: string
  amount: string
  isLoading: boolean
}

export function TransferConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  recipient,
  amount,
  isLoading
}: TransferConfirmationModalProps) {
  const { t } = useI18n()
  const [confirmText, setConfirmText] = useState('')

  if (!isOpen) return null

  const requiredText = t('transfer.confirmText')
  const isConfirmed = confirmText.toLowerCase() === requiredText.toLowerCase()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('transfer.confirmTitle')}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div style={{ 
            background: 'var(--bg-subtle)', 
            padding: 20, 
            borderRadius: 12,
            marginBottom: 20
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {t('transfer.recipientLabel')}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{recipient}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {t('transfer.amountLabel')}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>
                {amount} TRV
              </div>
            </div>

            <div style={{ 
              padding: 12, 
              background: 'var(--color-danger-alpha-10)', 
              borderRadius: 8,
              border: '1px solid var(--color-danger-alpha-20)'
            }}>
              <div style={{ fontSize: 13, color: 'var(--color-danger)' }}>
                ⚠️ {t('transfer.warning')}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>
              {t('transfer.typeToConfirm')} <strong>"{requiredText}"</strong>:
            </label>
            <input
              type="text"
              className="input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={requiredText}
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
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!isConfirmed || isLoading}
          >
            {isLoading ? (
              <span className="animate-pulse">{t('actions.processing')}</span>
            ) : (
              t('transfer.confirmButton')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
