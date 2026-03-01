import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Simple SVG icons
const LoaderIcon = () => (
  <svg className="w-16 h-16 text-[#7C3AED] animate-spin mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
)

const CheckIcon = () => (
  <svg className="w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
)

const XIcon = () => (
  <svg className="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
)

const ArrowIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
  </svg>
)

export function ConfirmRegistration() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing token')
      return
    }

    confirmRegistration(token)
  }, [token])

  const confirmRegistration = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/confirm-registration?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok && data.status === 'success') {
        setStatus('success')
        setMessage(data.message || 'Registration confirmed successfully! You can now log in.')
      } else {
        setStatus('error')
        setMessage(data.message || 'Failed to confirm registration')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Network error. Please try again.')
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
          <p className="text-gray-400 mt-2">Email Confirmation</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
          {status === 'loading' && (
            <div className="text-center py-8">
              <LoaderIcon />
              <p className="text-white text-lg">Confirming your registration...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckIcon />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Registration Confirmed!
              </h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#EA1D2C] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Go to Login
                <ArrowIcon />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XIcon />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Confirmation Failed
              </h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="flex-1 bg-white/10 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#EA1D2C] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Go to Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Need help?{' '}
          <a href="mailto:suporte@trenvus.com" className="text-[#7C3AED] hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}
