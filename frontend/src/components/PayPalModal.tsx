import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

interface PayPalModalProps {
  isOpen: boolean
  onClose: () => void
  amount: string
  onSuccess: () => void
}

export function PayPalModal({ isOpen, onClose, amount, onSuccess }: PayPalModalProps) {
  const auth = useAuth()
  const { t, locale } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePayPalPayment = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = await auth.getValidAccessToken()
      
      // Cria a ordem no PayPal
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create PayPal order')
      }
      
      const data = await response.json()
      
      // Redireciona para o PayPal
      if (data.approvalUrl) {
        // Salva o orderId no localStorage para recuperar depois
        localStorage.setItem('paypal_order_id', data.orderId)
        localStorage.setItem('paypal_amount', amount)
        window.location.href = data.approvalUrl
      } else {
        throw new Error('No approval URL received')
      }
    } catch (err: any) {
      setError(err?.message || 'Payment failed')
      setLoading(false)
    }
  }

  // Determina o texto baseado no idioma
  const isPortuguese = locale === 'pt-BR'
  const currency = isPortuguese ? 'BRL' : 'USD'
  const currencySymbol = isPortuguese ? 'R$' : '$'
  
  const title = isPortuguese ? 'Pagamento via PayPal' : 'PayPal Payment'
  const description = isPortuguese 
    ? `Você será redirecionado para o PayPal para completar o pagamento de ${currencySymbol}${amount} ${currency}.`
    : `You will be redirected to PayPal to complete the payment of ${currencySymbol}${amount} ${currency}.`
  const buttonText = isPortuguese ? 'Continuar para o PayPal' : 'Continue to PayPal'
  const cancelText = isPortuguese ? 'Cancelar' : 'Cancel'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}
          
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {/* PayPal Logo */}
            <div style={{ marginBottom: 20 }}>
              <svg width="120" height="32" viewBox="0 0 120 32" fill="none">
                <path d="M12.5 6.5C12.5 6.5 8 6.5 7 6.5C6.5 6.5 6 7 6 7.5L4 22.5C4 23 4.5 23.5 5 23.5H8L8.5 19.5H11C15 19.5 17.5 17.5 18 13.5C18.5 9.5 16 6.5 12.5 6.5Z" fill="#003087"/>
                <path d="M46.5 6.5C46.5 6.5 42 6.5 41 6.5C40.5 6.5 40 7 40 7.5L38 22.5C38 23 38.5 23.5 39 23.5H42L42.5 19.5H45C49 19.5 51.5 17.5 52 13.5C52.5 9.5 50 6.5 46.5 6.5Z" fill="#0070E0"/>
                <path d="M25 6.5C24.5 6.5 24 7 24 7.5L22 22.5C22 23 22.5 23.5 23 23.5H26L27.5 12.5C27.5 12.5 29 12.5 30 12.5C30.5 12.5 31 12 31 11.5L31.5 7.5C31.5 7 31 6.5 30.5 6.5H25Z" fill="#003087"/>
                <path d="M58 6.5C57.5 6.5 57 7 57 7.5L55 22.5C55 23 55.5 23.5 56 23.5H59L60.5 12.5C60.5 12.5 62 12.5 63 12.5C63.5 12.5 64 12 64 11.5L64.5 7.5C64.5 7 64 6.5 63.5 6.5H58Z" fill="#0070E0"/>
                <text x="70" y="20" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#003087">PayPal</text>
              </svg>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              {description}
            </p>
            
            <div style={{ 
              background: 'var(--bg-subtle)', 
              padding: 16, 
              borderRadius: 8,
              marginBottom: 20
            }}>
              <div style={{ fontSize: 24, fontWeight: 600 }}>
                {currencySymbol}{amount}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {currency}
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handlePayPalPayment}
            disabled={loading}
            style={{ minWidth: 180 }}
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <span style={{ marginRight: 8 }}>🅿️</span>
                {buttonText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
