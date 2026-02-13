import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { LanguageSwitcher, useI18n } from './i18n'
import brandLogo from './assets/brand-mark.png'

export function Shell() {
  const auth = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const invoicesActive = location.pathname.startsWith('/app/invoices')
  const [invoicesOpen, setInvoicesOpen] = useState(false)
  const invoicesRef = useRef<HTMLDivElement | null>(null)

  const closeInvoices = useMemo(() => () => setInvoicesOpen(false), [])

  useEffect(() => {
    closeInvoices()
  }, [location.pathname, closeInvoices])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const root = invoicesRef.current
      if (!root) return
      const target = e.target
      if (target instanceof Node && root.contains(target)) return
      closeInvoices()
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [closeInvoices])

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/" className="brand">
              <img className="brand-logo" src={brandLogo} alt="TRENVUS" />
            </Link>
            <LanguageSwitcher />

            <nav className="nav">
              <NavLink to="/app">{t('nav.dashboard')}</NavLink>
              <NavLink to="/app/statement">{t('nav.statement')}</NavLink>
              <NavLink to="/app/market">{t('nav.market')}</NavLink>
              <NavLink to="/app/transfer">{t('nav.transfer')}</NavLink>
              <div
                ref={invoicesRef}
                className={`nav-dropdown ${invoicesActive ? 'active' : ''} ${invoicesOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="nav-dropdown-trigger"
                  onClick={() => setInvoicesOpen((v) => !v)}
                  aria-expanded={invoicesOpen}
                >
                  {t('nav.invoices')}
                </button>
                <div className="nav-dropdown-menu" role="menu">
                  <NavLink to="/app/invoices/send">{t('nav.invoicesSend')}</NavLink>
                  <NavLink to="/app/invoices/receive">{t('nav.invoicesReceive')}</NavLink>
                </div>
              </div>
              {auth.isAdmin ? <NavLink to="/app/admin/users">{t('nav.admin')}</NavLink> : null}
            </nav>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {auth.userEmail || auth.userNickname ? (
              <div className="pill">{auth.userNickname || auth.userEmail}</div>
            ) : null}
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
