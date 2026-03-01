import { useState } from 'react'
import { useI18n } from '../i18n'
import { api } from '../api'
import { useAuth } from '../auth'

interface ExportPdfModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
  pdfData: string | null
  fileName: string
}

export function ExportPdfModal({ isOpen, onClose, onDownload, pdfData, fileName }: ExportPdfModalProps) {
  const { t } = useI18n()
  const auth = useAuth()
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [sendMessage, setSendMessage] = useState('')

  if (!isOpen) return null

  const handleSendByEmail = async () => {
    if (!pdfData) return
    
    setIsSending(true)
    setSendStatus('idle')
    setSendMessage('')
    
    try {
      const token = await auth.getValidAccessToken()
      // Remove data:application/pdf;base64, prefix
      const base64Data = pdfData.split(',')[1]
      const response = await api.sendStatementByEmail(token, base64Data, fileName)
      
      if (response.status === 'success') {
        setSendStatus('success')
        setSendMessage(t('exportPdf.success'))
      } else {
        setSendStatus('error')
        setSendMessage(t('exportPdf.error'))
      }
    } catch (error: any) {
      setSendStatus('error')
      setSendMessage(t('exportPdf.networkError'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('exportPdf.title')}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="modal-description">
            {t('exportPdf.description')}
          </p>
          
          <div className="export-options">
            <button 
              className="export-option-btn"
              onClick={onDownload}
              disabled={!pdfData}
            >
              <div className="export-option-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
              </div>
              <div className="export-option-text">
                <strong>{t('exportPdf.download')}</strong>
                <span>{t('exportPdf.downloadDesc')}</span>
              </div>
            </button>

            <button 
              className="export-option-btn"
              onClick={handleSendByEmail}
              disabled={isSending || !pdfData}
            >
              <div className="export-option-icon email">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div className="export-option-text">
                <strong>{t('exportPdf.sendEmail')}</strong>
                <span>{t('exportPdf.sendEmailDesc')}</span>
              </div>
              {isSending && <span className="loading-spinner-small" />}
            </button>
          </div>

          {sendStatus !== 'idle' && (
            <div className={`alert alert-${sendStatus}`}>
              {sendStatus === 'success' ? '✓ ' : '✗ '}
              {sendMessage}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--bg-card, #1a1a2e);
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          border: 1px solid var(--border-color, rgba(255,255,255,0.1));
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.1));
        }
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: var(--text-primary, #fff);
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--text-secondary, #888);
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .modal-close:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary, #fff);
        }
        .modal-body {
          padding: 24px;
        }
        .modal-description {
          margin: 0 0 20px;
          color: var(--text-secondary, #888);
          font-size: 14px;
        }
        .export-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .export-option-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg-subtle, rgba(255,255,255,0.05));
          border: 1px solid var(--border-color, rgba(255,255,255,0.1));
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          color: inherit;
        }
        .export-option-btn:hover:not(:disabled) {
          background: var(--bg-hover, rgba(255,255,255,0.1));
          border-color: var(--color-primary, #7C3AED);
        }
        .export-option-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .export-option-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .export-option-icon.email {
          background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
        }
        .export-option-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .export-option-text strong {
          color: var(--text-primary, #fff);
          font-size: 15px;
        }
        .export-option-text span {
          color: var(--text-secondary, #888);
          font-size: 13px;
        }
        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #7C3AED;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .alert {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
        }
        .alert-success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }
        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
      `}</style>
    </div>
  )
}
