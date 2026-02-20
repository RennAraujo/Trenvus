import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth'
import { LanguageSwitcher, useI18n } from './i18n'
import brandLogo from './assets/brand-mark.png'

// Icons
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  </svg>
)

const AdminIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
)

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
            {auth.userEmail ? <div className="pill">{auth.userEmail}</div> : null}
    setMobileMenuOpen(false)
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


  useEffect(() => {
    closeUserMenu()
  }, [location.pathname, closeUserMenu])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const userInitials = useMemo(() => {
    if (auth.userNickname) {
      return auth.userNickname.slice(0, 2).toUpperCase()
    }
    if (auth.userEmail) {
      return auth.userEmail.slice(0, 2).toUpperCase()
    }
    return 'U'
  }, [auth.userNickname, auth.userEmail])

  const navItems = [
    { to: '/app', icon: DashboardIcon, label: t('nav.dashboard') },
    { to: '/app/statement', icon: StatementIcon, label: t('nav.statement') },
    { to: '/app/market', icon: MarketIcon, label: t('nav.market') },
    { to: '/app/transfer', icon: TransferIcon, label: t('nav.transfer') },
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <Link to="/" className="brand">
              <img className="brand-logo" src={brandLogo} alt="TRENVUS" />
            </Link>
            
            <LanguageSwitcher />

            <nav className="nav">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className="nav-link" end={item.to === '/app'}>
                  <item.icon />
                  {item.label}
                </NavLink>
              ))}
              
              <div
                ref={invoicesRef}
                className={`dropdown ${invoicesOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className={`dropdown-trigger ${invoicesActive ? 'active' : ''}`}
                  onClick={() => setInvoicesOpen((v) => !v)}
                  aria-expanded={invoicesOpen}
                >
                  <InvoiceIcon />
                  {t('nav.invoices')}
                  <ChevronDownIcon />
                </button>
                <div className="dropdown-menu" role="menu">
                  <NavLink to="/app/invoices/send" className="dropdown-item">
                    {t('nav.invoicesSend')}
                  </NavLink>
                  <NavLink to="/app/invoices/receive" className="dropdown-item">
                    {t('nav.invoicesReceive')}
                  </NavLink>
                </div>
              </div>
              
              {auth.isAdmin && (
                <NavLink to="/app/admin/users" className="nav-link">
                  <AdminIcon />
                  {t('nav.admin')}
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>

            {(auth.userEmail || auth.userNickname) ? (
              <div
                className={`dropdown ${userOpen ? 'open' : ''}`}
                onMouseEnter={() => setUserOpen(true)}
                onMouseLeave={() => setUserOpen(false)}
              >
                <div className="user-pill">
                  <span className="user-avatar" aria-hidden="true">
                    {auth.userAvatarDataUrl ? (
                      <img src={auth.userAvatarDataUrl} alt="" />
                    ) : (
                      userInitials
                    )}
                  </span>
                  <span className="hidden sm:block">{auth.userNickname || auth.userEmail}</span>
                </div>
                <div className="dropdown-menu" role="menu" style={{ minWidth: 180 }}>
                  <NavLink to="/app/account" className="dropdown-item">
                    <UserIcon />
                    {t('nav.account')}
                  </NavLink>
                  <div className="dropdown-divider" style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                  <button className="dropdown-item" onClick={auth.logout} style={{ width: '100%', color: 'var(--color-danger)' }}>
                    <LogoutIcon />
                    {t('actions.logout')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className="mobile-nav-link" 
              end={item.to === '/app'}
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
          
          <div style={{ marginTop: 8 }}>
            <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.08, color: 'var(--text-muted)' }}>
              {t('nav.invoices')}
            </div>
            <NavLink to="/app/invoices/send" className="mobile-nav-link" style={{ paddingLeft: 40 }}>
              {t('nav.invoicesSend')}
            </NavLink>
            <NavLink to="/app/invoices/receive" className="mobile-nav-link" style={{ paddingLeft: 40 }}>
              {t('nav.invoicesReceive')}
            </NavLink>
          </div>
          
          {auth.isAdmin && (
            <NavLink to="/app/admin/users" className="mobile-nav-link">
              <AdminIcon />
              {t('nav.admin')}
            </NavLink>
          )}
          
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <NavLink to="/app/account" className="mobile-nav-link">
              <UserIcon />
              {t('nav.account')}
            </NavLink>
            <button className="mobile-nav-link" onClick={auth.logout} style={{ color: 'var(--color-danger)', width: '100%' }}>
              <LogoutIcon />
              {t('actions.logout')}
            </button>
          </div>
        </nav>
      </div>

      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
