import { useState } from 'react'
import { useI18n } from '../i18n'

interface ConvertConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  direction: 'USD_TO_TRV' | 'TRV_TO_USD'
  amount: string
  fee: string
  receive: string
  isLoading: boolean
}

export function ConvertConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  direction,
  amount,
  fee,
  receive,
  isLoading
}: ConvertConfirmationModalProps) {
  const { t } = useI18n()
  const [confirmText, setConfirmText] = useState('')

  if (!isOpen) return null

  const isUsdToTrv = direction === 'USD_TO_TRV'
  const fromCurrency = isUsdToTrv ? 'USD' : 'TRV'
  const toCurrency = isUsdToTrv ? 'TRV' : 'USD'
  const requiredText = t('convert.confirmText')
  const isConfirmed = confirmText.toLowerCase() === requiredText.toLowerCase()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('convert.confirmTitle')}</h3>
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
                {t('convert.youSend')}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{amount} {fromCurrency}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {t('convert.fee')} (1%)
              </div>
              <div style={{ fontSize: 16, color: 'var(--color-danger)' }}>-{fee} {fromCurrency}</div>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '12px 0' }} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {t('convert.youReceive')}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)' }}>
                {receive} {toCurrency}
              </div>
            </div>

            <div style={{ 
              padding: 12, 
              background: 'var(--color-warning-alpha-10)', 
              borderRadius: 8,
              border: '1px solid var(--color-warning-alpha-20)'
            }}>
              <div style={{ fontSize: 13, color: 'var(--color-warning)' }}>
                ⚠️ {t('convert.rateWarning')}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>
              {t('convert.typeToConfirm')} <strong>"{requiredText}"</strong>:
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
              t('convert.confirmButton')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
