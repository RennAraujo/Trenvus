import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth'
import { LanguageSwitcher, useI18n } from './i18n'

export function Shell() {
  const auth = useAuth()
  const { t } = useI18n()

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <LanguageSwitcher />
            <Link to="/" className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <span>TRENVUS</span>
            </Link>

            <nav className="nav">
              <NavLink to="/app">{t('nav.dashboard')}</NavLink>
              <NavLink to="/app/statement">{t('nav.statement')}</NavLink>
              <NavLink to="/app/market">{t('nav.market')}</NavLink>
              <NavLink to="/app/transfer">{t('nav.transfer')}</NavLink>
            </nav>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {auth.userEmail ? <div className="pill">{auth.userEmail}</div> : null}
            <button className="btn btn-danger" onClick={auth.logout}>
              {t('actions.logout')}
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

