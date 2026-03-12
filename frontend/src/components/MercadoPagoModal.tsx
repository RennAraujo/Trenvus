import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

interface MercadoPagoModalProps {
  isOpen: boolean
  onClose: () => void
  amount: string
  onSuccess: () => void
}

export function MercadoPagoModal({ isOpen, onClose, amount, onSuccess }: MercadoPagoModalProps) {
  const auth = useAuth()
  const { locale, t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && amount) {
      createPreference()
    }
  }, [isOpen, amount])

  function formatError(err: unknown): string {
    const raw = typeof (err as any)?.message === 'string' ? (err as any).message : ''
    try {
      const parsed = raw ? JSON.parse(raw) as { code?: unknown } : null
      const code = typeof parsed?.code === 'string' ? parsed.code : ''
      if (code === 'MERCADOPAGO_INVALID_TOKEN') return t('mercadopago.errors.invalidToken')
      if (code === 'MERCADOPAGO_API_ERROR' || code === 'MERCADOPAGO_ERROR') return t('mercadopago.errors.unavailable')
    } catch {
    }
    if (raw.startsWith('MP API Error: 401')) return t('mercadopago.errors.invalidToken')
    if (raw.startsWith('MP API Error:')) return t('mercadopago.errors.unavailable')
    return raw || t('mercadopago.errors.unavailable')
  }

  const createPreference = async () => {
    setLoading(true)
    setError(null)
    setPaymentUrl(null)

    try {
      const token = await auth.getValidAccessToken()

      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })

      const data = await response.json().catch(() => ({} as any))

      if (!response.ok) {
        throw new Error(JSON.stringify(data))
      }

      if (!data.preferenceId) {
        throw new Error(t('mercadopago.errors.unavailable'))
      }

      // Salva o valor no sessionStorage
      sessionStorage.setItem('mercadopago_amount', amount)

      // Usa o sandbox_init_point para ambiente de teste
      const url = data.sandboxInitPoint || data.initPoint
      setPaymentUrl(url)
    } catch (err: any) {
      console.error(err)
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPayment = async () => {
    if (paymentUrl) {
      // EM AMBIENTE DE TESTE: Faz o depósito imediatamente
      // Em produção, isso deve ser feito após confirmação do webhook
      try {
        const token = await auth.getValidAccessToken()
        
        // Faz o depósito na carteira
        const depositResponse = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amountUsd: parseFloat(amount).toFixed(2) })
        })

        if (!depositResponse.ok) {
          const errorData = await depositResponse.json()
          throw new Error(errorData.message || 'Failed to deposit')
        }

        // Limpa o sessionStorage
        sessionStorage.removeItem('mercadopago_amount')
        
        // Abre o Mercado Pago em nova aba
        window.open(paymentUrl, '_blank')
        
        // Chama onSuccess para atualizar a carteira na tela
        onSuccess()
      } catch (err: any) {
        setError(err?.message || t('mercadopago.errors.depositFailed'))
      }
    }
  }

  const isPortuguese = () => locale === 'pt-BR'
  const currencySymbol = isPortuguese() ? 'R$' : '$'

  const title = t('mercadopago.title')
  const description = t('mercadopago.description', { amount })
  const cancelText = t('mercadopago.cancel')
  const payText = t('mercadopago.pay')

  if (!isOpen) return null

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
            {/* Mercado Pago Logo */}
            <div style={{ marginBottom: 20 }}>
              <svg width="150" height="40" viewBox="0 0 150 40" fill="none">
                <rect width="150" height="40" rx="8" fill="#00B1EA"/>
                <text x="75" y="26" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="white" textAnchor="middle">Mercado Pago</text>
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
                BRL
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 20 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  border: '3px solid var(--border-subtle)',
                  borderTop: '3px solid #00B1EA',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }} />
                <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>
                  {t('mercadopago.processing')}
                </p>
              </div>
            ) : paymentUrl ? (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleOpenPayment}
                style={{ width: '100%', marginTop: 10 }}
              >
                {payText} →
              </button>
            ) : null}
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
        </div>
      </div>
    </div>
  )
}
