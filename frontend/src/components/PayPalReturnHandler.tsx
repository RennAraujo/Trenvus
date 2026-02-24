import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

export function PayPalReturnHandler() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const auth = useAuth()
  const { t, locale } = useI18n()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handlePayPalReturn = async () => {
      const paypalStatus = searchParams.get('paypal')
      const orderId = localStorage.getItem('paypal_order_id')
      const amount = localStorage.getItem('paypal_amount')

      if (paypalStatus === 'cancel') {
        setStatus('error')
        setMessage(isPortuguese() ? 'Pagamento cancelado.' : 'Payment cancelled.')
        setTimeout(() => navigate('/dashboard'), 3000)
        return
      }

      if (!orderId || paypalStatus !== 'success') {
        setStatus('error')
        setMessage(isPortuguese() ? 'Erro no pagamento.' : 'Payment error.')
        setTimeout(() => navigate('/dashboard'), 3000)
        return
      }

      try {
        const token = await auth.getValidAccessToken()
        
        // Captura o pagamento
        const response = await fetch(`/api/paypal/capture/${orderId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to capture payment')
        }

        const data = await response.json()

        if (data.status === 'COMPLETED') {
          // Faz o depósito na carteira
          const depositResponse = await fetch('/api/wallet/deposit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amountUsd: amount })
          })

          if (!depositResponse.ok) {
            throw new Error('Failed to deposit to wallet')
          }

          setStatus('success')
          setMessage(isPortuguese() 
            ? `Pagamento de ${getCurrencySymbol()}${amount} ${getCurrency()} confirmado!` 
            : `Payment of ${getCurrencySymbol()}${amount} ${getCurrency()} confirmed!`)
          
          // Limpa o localStorage
          localStorage.removeItem('paypal_order_id')
          localStorage.removeItem('paypal_amount')
          
          setTimeout(() => navigate('/dashboard'), 2000)
        } else {
          throw new Error('Payment not completed')
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(err?.message || (isPortuguese() ? 'Erro ao processar pagamento.' : 'Error processing payment.'))
        setTimeout(() => navigate('/dashboard'), 3000)
      }
    }

    handlePayPalReturn()
  }, [searchParams, navigate, auth])

  const isPortuguese = () => locale === 'pt-BR'
  const getCurrency = () => isPortuguese() ? 'BRL' : 'USD'
  const getCurrencySymbol = () => isPortuguese() ? 'R$' : '$'

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: 20
    }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: 400,
        padding: 40,
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px solid var(--border-subtle)'
      }}>
        {status === 'processing' && (
          <>
            <div style={{ 
              width: 48, 
              height: 48, 
              border: '3px solid var(--border-subtle)', 
              borderTop: '3px solid var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p style={{ fontSize: 18, fontWeight: 500 }}>
              {isPortuguese() ? 'Processando pagamento...' : 'Processing payment...'}
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={{ 
              width: 48, 
              height: 48, 
              background: 'var(--color-success)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 24
            }}>
              ✓
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-success)' }}>
              {isPortuguese() ? 'Sucesso!' : 'Success!'}
            </p>
            <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={{ 
              width: 48, 
              height: 48, 
              background: 'var(--color-danger)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 24
            }}>
              ✕
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-danger)' }}>
              {isPortuguese() ? 'Erro' : 'Error'}
            </p>
            <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{message}</p>
          </>
        )}
      </div>
    </div>
  )
}
