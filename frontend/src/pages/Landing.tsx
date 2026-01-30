import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>TRENVUS</span>
          </Link>
          <nav className="nav">
            <a href="#features">Recursos</a>
            <a href="#security">Segurança</a>
          </nav>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="btn" to="/login">
              Entrar
            </Link>
            <Link className="btn btn-primary" to="/register">
              Start your Journey Now
            </Link>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="hero">
            <div>
              <h1 className="title">Welcome to tomorrow-today!</h1>
              <p className="subtitle">
                Deposite USD e converta para VPS com câmbio 1:1, com uma taxa fixa e transparente por transação.
                Controle total, interface moderna e segurança no backend.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                <Link className="btn btn-primary" to="/register">
                  Criar conta
                </Link>
                <Link className="btn" to="/login">
                  Já tenho conta
                </Link>
              </div>

              <div id="features" style={{ marginTop: 22 }} className="grid">
                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill pill-accent">1:1</div>
                    <h3 style={{ margin: '10px 0 6px' }}>Conversão simples</h3>
                    <div className="muted">
                      USD → VPS sem variação de câmbio. A taxa é fixa: 0,50 USD por conversão.
                    </div>
                  </div>
                </div>
                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">Privacidade</div>
                    <h3 style={{ margin: '10px 0 6px' }}>Extrato privado</h3>
                    <div className="muted">O extrato exibe apenas valores, reduzindo exposição de informações.</div>
                  </div>
                </div>
                <div className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">Mercado</div>
                    <h3 style={{ margin: '10px 0 6px' }}>Acompanhe preços</h3>
                    <div className="muted">Painel de mercado com preços e variação 24h para ativos configuráveis.</div>
                  </div>
                </div>
                <div id="security" className="col-6 card">
                  <div className="card-inner">
                    <div className="pill">Seguro</div>
                    <h3 style={{ margin: '10px 0 6px' }}>Transação segura</h3>
                    <div className="muted">
                      JWT assinado (RS256), senhas com BCrypt, validações e controle de concorrência no saldo.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true" />
          </div>
        </div>
      </main>
    </div>
  )
}

