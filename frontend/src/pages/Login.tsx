import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'

export function Login() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isTestLogin = searchParams.get('test') === '1'

  const loginTestAccount = useCallback(async () => {
    const testEmail = 'user@test.com'
    const testPassword = '123'
    setEmail(testEmail)
    setPassword(testPassword)

    setError(null)
    setBusy(true)
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await auth.login(testEmail, testPassword)
          navigate('/app', { replace: true })
          return
        } catch (err: any) {
          const status = typeof err?.status === 'number' ? (err.status as number) : null
          const retryable = err?.name === 'NetworkError' || status === 502 || status === 503 || status === 504
          if (attempt < 4 && retryable) {
            await new Promise((r) => setTimeout(r, 600))
            continue
          }
          throw err
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao entrar com conta de teste')
    } finally {
      setBusy(false)
    }
  }, [auth, navigate])

  useEffect(() => {
    if (!isTestLogin) return
    loginTestAccount()
  }, [isTestLogin, loginTestAccount])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await auth.login(email, password)
      navigate('/app', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Falha ao entrar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>TRENVUS</span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="btn" to="/register">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="grid">
            <div className="col-6 card" style={{ margin: '0 auto', maxWidth: 560, gridColumn: 'span 12' as any }}>
              <div className="card-inner">
                <h2 style={{ margin: 0 }}>Entrar</h2>
                <p className="muted" style={{ marginTop: 6 }}>
                  Acesse seu dashboard para depositar USD e converter para VPS.
                </p>

                <form onSubmit={onSubmit} className="list" style={{ marginTop: 14 }}>
                  <div className="field">
                    <div className="label">E-mail</div>
                    <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="field">
                    <div className="label">Senha</div>
                    <input
                      className="input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error ? <div className="error">{error}</div> : null}
                  <button className="btn btn-primary" disabled={busy} type="submit">
                    {busy ? 'Entrando...' : 'Entrar'}
                  </button>
                  {isTestLogin ? (
                    <button className="btn" disabled={busy} type="button" onClick={loginTestAccount}>
                      Entrar com conta teste
                    </button>
                  ) : null}
                </form>

                <div className="muted" style={{ marginTop: 14 }}>
                  Não tem conta? <Link to="/register" className="pill pill-accent">Criar agora</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
