import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export function Register() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await auth.register(email, password)
      navigate('/app', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Falha ao criar conta')
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
            <Link className="btn" to="/login">
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="grid">
            <div className="col-6 card" style={{ margin: '0 auto', maxWidth: 560, gridColumn: 'span 12' as any }}>
              <div className="card-inner">
                <h2 style={{ margin: 0 }}>Criar conta</h2>
                <p className="muted" style={{ marginTop: 6 }}>
                  Crie sua conta para ver saldo, extrato privado e acompanhar o mercado.
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
                    {busy ? 'Criando...' : 'Criar conta'}
                  </button>
                </form>

                <div className="muted" style={{ marginTop: 14 }}>
                  Já tem conta?{' '}
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <Link to="/login" className="pill pill-accent">
                      Entrar
                    </Link>
                    <Link to="/login?test=1" className="pill" aria-disabled={busy}>
                      Conta teste
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
