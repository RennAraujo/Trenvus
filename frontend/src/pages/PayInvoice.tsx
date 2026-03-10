import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'

// Icons
const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
)

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

interface InvoiceData {
  id: string
  recipientId: number
  recipientEmail: string
  recipientNickname: string
  amount: string
  currency: 'USD' | 'TRV'
  description: string
  timestamp: number
}

export function PayInvoice() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const auth = useAuth()
  
  const [step, setStep] = useState<'loading' | 'login-required' | 'confirmation' | 'processing' | 'success' | 'error'>('loading')
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const invoiceParam = searchParams.get('invoice')

  useEffect(() => {
    if (!invoiceParam) {
      setError('Invalid or missing invoice code')
      setStep('error')
      return
    }

    try {
      // Decodifica o invoice
      const decoded = JSON.parse(atob(invoiceParam))
      setInvoice({
        id: decoded.invoiceId || decoded.id,
        recipientId: decoded.recipientId,
        recipientEmail: decoded.recipientEmail,
        recipientNickname: decoded.recipientNickname,
        amount: decoded.amount,
        currency: decoded.currency,
        description: decoded.description,
        timestamp: decoded.timestamp
      })

      // Verifica se está logado
      checkAuth()
    } catch (err) {
      setError('Invalid invoice format')
      setStep('error')
    }
  }, [invoiceParam])

  async function checkAuth() {
    try {
      const token = await auth.getValidAccessToken()
      if (token) {
        // Está logado, carrega wallet e mostra confirmação
        const walletData = await api.getWallet(token)
        setWallet(walletData)
        setStep('confirmation')
      } else {
        // Não está logado
        setStep('login-required')
      }
    } catch {
      setStep('login-required')
    }
  }

  function goToLogin() {
    // Salva a URL atual para redirect após login
    sessionStorage.setItem('redirectAfterLogin', window.location.href)
    navigate('/login')
  }

  async function confirmPayment() {
    if (!invoice) return

    setProcessing(true)
    setStep('processing')

    try {
      const token = await auth.getValidAccessToken()
      
      // Verifica saldo suficiente
      const balance = invoice.currency === 'USD' ? wallet?.usdCents : wallet?.trvCents
      const amountCents = Math.round(parseFloat(invoice.amount) * 100)
      
      if (!balance || balance < amountCents) {
        throw new Error(`Insufficient ${invoice.currency} balance`)
      }

      // Executa o pagamento
      await api.payInvoice(token, invoiceParam!, invoice.amount, invoice.currency)
      
      setStep('success')
    } catch (err: any) {
      setError(err?.message || 'Payment failed')
      setStep('error')
    } finally {
      setProcessing(false)
    }
  }

  function cancelPayment() {
    navigate('/')
  }

  // Loading
  if (step === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="animate-pulse" style={{ color: 'white', fontSize: 18 }}>Loading...</div>
      </div>
    )
  }

  // Error
  if (step === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center',
          maxWidth: 400,
          color: 'white'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <XIcon />
          </div>
          
          <h2 style={{ marginBottom: 12 }}>Payment Error</h2>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>{error || 'Something went wrong'}</p>
          
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '16px 32px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Login Required
  if (step === 'login-required') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.15) 0%, rgba(234, 29, 44, 0.1) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center',
          maxWidth: 400,
          color: 'white'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <LockIcon />
          </div>
          
          <h2 style={{ marginBottom: 12, fontSize: 24 }}>Login Required</h2>
          <p style={{ opacity: 0.7, marginBottom: 32 }}>
            Please log in to complete this payment
          </p>

          {invoice && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 32
            }}>
              <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 8 }}>Payment Amount</div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {invoice.amount} {invoice.currency}
              </div>
              <div style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>To: {invoice.recipientNickname}</div>
            </div>
          )}
          
          <button
            onClick={goToLogin}
            style={{
              width: '100%',
              padding: '18px 32px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 12
            }}
          >
            Log In to Continue
          </button>
          
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              padding: '14px 32px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'white',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Confirmation
  if (step === 'confirmation' && invoice) {
    const balance = invoice.currency === 'USD' ? wallet?.usdCents : wallet?.trvCents
    const amountCents = Math.round(parseFloat(invoice.amount) * 100)
    const hasEnoughBalance = balance && balance >= amountCents

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        padding: '24px 16px'
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <button
              onClick={cancelPayment}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 16
              }}
            >
              <ArrowLeftIcon />
              Cancel
            </button>
            
            <h1 style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>Confirm Payment</h1>
          </div>

          {/* Payment Card */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.15) 0%, rgba(234, 29, 44, 0.1) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: 24,
            padding: 32,
            marginBottom: 24
          }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <WalletIcon />
              </div>
              
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>You will pay</div>
              
              <div style={{
                fontSize: 48,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {invoice.amount} {invoice.currency}
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 16,
              padding: 20
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>To</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'white' }}>{invoice.recipientNickname}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{invoice.recipientEmail}</div>
                </div>
              </div>

              {invoice.description && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Description</span>
                  <span style={{ color: 'white' }}>{invoice.description}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Your Balance</span>
                <span style={{ fontWeight: 600, color: hasEnoughBalance ? '#10b981' : '#ef4444' }}>
                  {formatUsd(balance || 0)} {invoice.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Warning if insufficient balance */}
          {!hasEnoughBalance && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              color: '#ef4444',
              textAlign: 'center'
            }}>
              Insufficient {invoice.currency} balance. Please deposit more funds.
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={cancelPayment}
              style={{
                flex: 1,
                padding: '18px 24px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              onClick={confirmPayment}
              disabled={!hasEnoughBalance || processing}
              style={{
                flex: 2,
                padding: '18px 24px',
                borderRadius: 12,
                border: 'none',
                background: hasEnoughBalance 
                  ? 'linear-gradient(135deg, #7C3AED 0%, #EA1D2C 100%)' 
                  : 'var(--bg-elevated)',
                color: hasEnoughBalance ? 'white' : 'var(--text-muted)',
                fontSize: 16,
                fontWeight: 600,
                cursor: hasEnoughBalance ? 'pointer' : 'not-allowed'
              }}
            >
              {processing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success
  if (step === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center',
          maxWidth: 400,
          color: 'white'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <CheckIcon />
          </div>
          
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Payment Successful!</h2>
          <p style={{ opacity: 0.9, marginBottom: 32 }}>Your payment has been processed successfully.</p>
          
          <button
            onClick={() => navigate('/app')}
            style={{
              padding: '16px 32px',
              borderRadius: 12,
              border: 'none',
              background: 'white',
              color: '#059669',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return null
}
