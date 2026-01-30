import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth'

export function Shell() {
  const auth = useAuth()

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>TRENVUS</span>
          </Link>

          <nav className="nav">
            <NavLink to="/app">Dashboard</NavLink>
            <NavLink to="/app/statement">Extrato</NavLink>
            <NavLink to="/app/market">Mercado</NavLink>
          </nav>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-danger" onClick={auth.logout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

