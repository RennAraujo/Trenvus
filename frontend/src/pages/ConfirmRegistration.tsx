import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'

export function ConfirmRegistration() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('confirmRegistration.invalidToken', 'Invalid or missing token'))
      return
    }

    confirmRegistration(token)
  }, [token])

  const confirmRegistration = async (token: string) => {
    try {
      const response = await api.get(`/auth/confirm-registration?token=${token}`)
      
      if (response.data.status === 'success') {
        setStatus('success')
        setMessage(response.data.message)
      } else {
        setStatus('error')
        setMessage(response.data.message || t('confirmRegistration.error', 'Failed to confirm registration'))
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(
        error.response?.data?.message || 
        t('confirmRegistration.error', 'Failed to confirm registration')
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#EA1D2C] bg-clip-text text-transparent">
            TRENVUS
          </h1>
          <p className="text-gray-400 mt-2">{t('confirmRegistration.title', 'Email Confirmation')}</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-[#7C3AED] animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">{t('confirmRegistration.confirming', 'Confirming your registration...')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('confirmRegistration.successTitle', 'Registration Confirmed!')}
              </h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#EA1D2C] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {t('confirmRegistration.goToLogin', 'Go to Login')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('confirmRegistration.errorTitle', 'Confirmation Failed')}
              </h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="flex-1 bg-white/10 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {t('confirmRegistration.tryAgain', 'Try Again')}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#EA1D2C] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('confirmRegistration.goToLogin', 'Go to Login')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          {t('confirmRegistration.needHelp', 'Need help?')}{' '}
          <a href="mailto:suporte@trenvus.com" className="text-[#7C3AED] hover:underline">
            {t('confirmRegistration.contactSupport', 'Contact Support')}
          </a>
        </p>
      </div>
    </div>
  )
}
