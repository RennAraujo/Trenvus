import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { api, formatUsd, type AdminFeeIncomeResponse, type AdminUserSummary, type AdminStatementItem } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
)

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)

const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
)

export function AdminUsers() {
  const auth = useAuth()
  const { t } = useI18n()

  const [query, setQuery] = useState('')
  const [items, setItems] = useState<AdminUserSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<{ usdCents: number; trvCents: number } | null>(null)
  const [feeIncome, setFeeIncome] = useState<AdminFeeIncomeResponse | null>(null)
  const [statement, setStatement] = useState<AdminStatementItem[]>([])
  const [statementPage, setStatementPage] = useState(0)
  const [statementHasNext, setStatementHasNext] = useState(false)
  const [statementSize, setStatementSize] = useState(20)
  const [walletUsd, setWalletUsd] = useState('0.00')
  const [walletTrv, setWalletTrv] = useState('0.00')
  const [role, setRole] = useState('USER')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedUser = useMemo(() => items.find((u) => u.id === selectedId) || null, [items, selectedId])

  async function loadUsers(q?: string) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.adminListUsers(token, q || undefined, 200)
      setItems(data)
      if (!selectedId && data.length) setSelectedId(data[0]!.id)
    } catch (err: any) {
      setError(err?.message || t('errors.loadUsers'))
    } finally {
      setBusy(false)
    }
  }

  async function loadWallet(userId: number) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.adminGetUserWallet(token, userId)
      setSelectedWallet(data)
      setWalletUsd((data.usdCents / 100).toFixed(2))
      setWalletTrv((data.trvCents / 100).toFixed(2))
    } catch (err: any) {
      setError(err?.message || t('errors.loadWallet'))
      setSelectedWallet(null)
    } finally {
      setBusy(false)
    }
  }

  async function loadFeeIncome(userId: number) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.adminGetUserFeeIncome(token, userId, 50)
      setFeeIncome(data)
    } catch (err: any) {
      setError(err?.message || t('errors.loadFees'))
      setFeeIncome(null)
    } finally {
      setBusy(false)
    }
  }

  async function loadStatement(userId: number, page = 0, size = 20) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.adminGetUserStatement(token, userId, page, size)
      setStatement(data.items)
      setStatementHasNext(data.hasNext)
      setStatementPage(page)
    } catch (err: any) {
      setError(err?.message || t('errors.loadStatement'))
      setStatement([])
      setStatementHasNext(false)
    } finally {
      setBusy(false)
    }
  }

  function exportStatementToPdf() {
    if (!selectedUser || statement.length === 0) return

    const userEmail = selectedUser.email || `user-${selectedUser.id}`
    const userName = selectedUser.email?.split('@')[0] || `User ${selectedUser.id}`
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `statement-${userEmail}-${dateStr}.pdf`

    // Calculate totals
    let totalUsdIn = 0, totalUsdOut = 0
    let totalTrvIn = 0, totalTrvOut = 0
    let totalFees = 0

    for (const tx of statement) {
      if (tx.usdAmountCents && tx.usdAmountCents > 0) totalUsdIn += tx.usdAmountCents
      if (tx.usdAmountCents && tx.usdAmountCents < 0) totalUsdOut += Math.abs(tx.usdAmountCents)
      if (tx.trvAmountCents && tx.trvAmountCents > 0) totalTrvIn += tx.trvAmountCents
      if (tx.trvAmountCents && tx.trvAmountCents < 0) totalTrvOut += Math.abs(tx.trvAmountCents)
      if (tx.feeUsdCents) totalFees += tx.feeUsdCents
    }

    // Create PDF
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40
    let y = 40

    // Header with user info
    doc.setFillColor(0, 102, 204)
    doc.rect(0, 0, pageWidth, 100, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text('Account Statement', margin, 60)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`User: ${userName}`, margin, 85)
    doc.text(`Email: ${userEmail}`, margin + 200, 85)

    y = 120

    // Generated date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y)
    y += 30

    // Summary Section
    doc.setFillColor(245, 245, 250)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 100, 4, 4, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('Summary', margin + 10, y + 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)

    const col1 = margin + 10
    const col2 = margin + 180
    const col3 = margin + 350

    doc.text('USD In:', col1, y + 45)
    doc.text('USD Out:', col1, y + 65)
    doc.text('TRV In:', col2, y + 45)
    doc.text('TRV Out:', col2, y + 65)
    doc.text('Total Fees:', col3, y + 45)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(`+${formatUsd(totalUsdIn)} USD`, col1 + 70, y + 45)
    doc.text(`-${formatUsd(totalUsdOut)} USD`, col1 + 70, y + 65)
    doc.text(`+${formatUsd(totalTrvIn)} TRV`, col2 + 70, y + 45)
    doc.text(`-${formatUsd(totalTrvOut)} TRV`, col2 + 70, y + 65)
    doc.text(`${formatUsd(totalFees)} USD`, col3 + 70, y + 45)

    y += 120

    // Transactions Table Header
    doc.setFillColor(0, 102, 204)
    doc.rect(margin, y, pageWidth - margin * 2, 25, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('Date', margin + 10, y + 16)
    doc.text('TEC', margin + 120, y + 16)
    doc.text('Type', margin + 220, y + 16)
    doc.text('USD', margin + 320, y + 16)
    doc.text('TRV', margin + 400, y + 16)
    doc.text('Fee', margin + 480, y + 16)

    y += 35

    // Transactions
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)

    for (const tx of statement) {
      // Check if we need a new page
      if (y > pageHeight - 60) {
        doc.addPage()
        y = 40

        // Repeat header on new page
        doc.setFillColor(0, 102, 204)
        doc.rect(margin, y, pageWidth - margin * 2, 25, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(255, 255, 255)
        doc.text('Date', margin + 10, y + 16)
        doc.text('TEC', margin + 120, y + 16)
        doc.text('Type', margin + 220, y + 16)
        doc.text('USD', margin + 320, y + 16)
        doc.text('TRV', margin + 400, y + 16)
        doc.text('Fee', margin + 480, y + 16)
        y += 35
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
      }

      // Date
      const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'
      doc.text(dateStr, margin + 10, y)

      // TEC
      doc.text(tx.tec, margin + 120, y)

      // Type
      doc.text(tx.type, margin + 220, y)

      // USD
      if (tx.usdAmountCents !== null && tx.usdAmountCents !== 0) {
        const usdValue = (tx.usdAmountCents / 100).toFixed(2)
        const usdText = tx.usdAmountCents >= 0 ? `+${usdValue}` : usdValue
        doc.setTextColor(tx.usdAmountCents >= 0 ? 0 : 200, tx.usdAmountCents >= 0 ? 150 : 0, 0)
        doc.text(`${usdText} USD`, margin + 320, y)
        doc.setTextColor(0, 0, 0)
      }

      // TRV
      if (tx.trvAmountCents !== null && tx.trvAmountCents !== 0) {
        const trvValue = (tx.trvAmountCents / 100).toFixed(2)
        const trvText = tx.trvAmountCents >= 0 ? `+${trvValue}` : trvValue
        doc.setTextColor(tx.trvAmountCents >= 0 ? 0 : 200, tx.trvAmountCents >= 0 ? 150 : 0, 0)
        doc.text(`${trvText} TRV`, margin + 400, y)
        doc.setTextColor(0, 0, 0)
      }

      // Fee
      if (tx.feeUsdCents !== null && tx.feeUsdCents > 0) {
        doc.text(`${(tx.feeUsdCents / 100).toFixed(2)} USD`, margin + 480, y)
      }

      y += 20
    }

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' })
    }

    // Download
    doc.save(filename.replace(/[^a-zA-Z0-9.-]/g, '_'))
  }

  async function saveWallet() {
    if (!selectedId) return
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.adminSetUserWallet(token, selectedId, walletUsd, walletTrv)
      setSelectedWallet(data)
    } catch (err: any) {
      setError(err?.message || t('errors.saveWallet'))
    } finally {
      setBusy(false)
    }
  }

  async function saveRole() {
    if (!selectedId) return
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const updated = await api.adminSetUserRole(token, selectedId, role)
      setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (err: any) {
      setError(err?.message || t('errors.saveRole'))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    setRole(selectedUser.role || 'USER')
    void loadWallet(selectedUser.id)
    void loadFeeIncome(selectedUser.id)
    void loadStatement(selectedUser.id, 0, statementSize)
  }, [selectedUser?.id])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">{t('admin.users.title')}</h1>
            <p className="page-subtitle">{t('admin.users.subtitle')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: 'var(--color-secondary-alpha-10)',
              color: 'var(--color-secondary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UsersIcon />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>User Management</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{items.length} users found</p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Search */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <SearchIcon />
              </span>
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('admin.users.searchPlaceholder')}
                style={{ paddingLeft: 44 }}
              />
            </div>
            <button className="btn btn-secondary" disabled={busy} onClick={() => loadUsers(query)}>
              <SearchIcon />
              {t('actions.search')}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }} className="md:grid-cols-1">
            {/* User List */}
            <div>
              <div className="text-xs font-semibold text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 12 }}>
                {t('admin.users.list')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 500, overflow: 'auto' }}>
                {items.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={`btn ${u.id === selectedId ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ 
                      width: '100%', 
                      justifyContent: 'space-between',
                      textAlign: 'left'
                    }}
                    onClick={() => setSelectedId(u.id)}
                  >
                    <span className="font-mono text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.email || `#${u.id}`}
                    </span>
                    <span className="badge badge-secondary">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Details */}
            <div>
              <div className="text-xs font-semibold text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 12 }}>
                {t('admin.users.details')}
              </div>

              {selectedUser ? (
                <div className="card" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="card-body">
                    {/* User Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div className="font-mono text-xs text-tertiary">ID: {selectedUser.id}</div>
                        <div className="font-mono" style={{ fontSize: 16, marginTop: 4 }}>
                          {selectedUser.email || '—'}
                        </div>
                      </div>
                      <span className="badge badge-primary">{selectedUser.role}</span>
                    </div>

                    {/* Wallet Section */}
                    <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <WalletIcon />
                        <span className="font-semibold">Wallet Balance</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <div className="text-xs text-tertiary mb-2">USD Balance</div>
                          <input 
                            className="input font-mono" 
                            value={walletUsd} 
                            onChange={(e) => setWalletUsd(e.target.value)}
                            style={{ background: 'var(--bg-elevated)' }}
                          />
                          <div className="text-xs text-muted mt-2">
                            Current: {selectedWallet ? `${formatUsd(selectedWallet.usdCents)} USD` : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-tertiary mb-2">TRV Balance</div>
                          <input 
                            className="input font-mono" 
                            value={walletTrv} 
                            onChange={(e) => setWalletTrv(e.target.value)}
                            style={{ background: 'var(--bg-elevated)' }}
                          />
                          <div className="text-xs text-muted mt-2">
                            Current: {selectedWallet ? `${formatUsd(selectedWallet.trvCents)} TRV` : '—'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button className="btn btn-primary btn-sm" disabled={busy} onClick={saveWallet}>
                          <SaveIcon />
                          {t('actions.save')}
                        </button>
                        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => loadWallet(selectedUser.id)}>
                          <RefreshIcon />
                          {t('actions.refresh')}
                        </button>
                      </div>
                    </div>

                    {/* Role Section */}
                    <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <ShieldIcon />
                        <span className="font-semibold">Role</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <select 
                          className="input" 
                          value={role} 
                          onChange={(e) => setRole(e.target.value)}
                          style={{ width: 200, background: 'var(--bg-elevated)' }}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button className="btn btn-primary btn-sm" disabled={busy} onClick={saveRole}>
                          {t('actions.apply')}
                        </button>
                      </div>
                    </div>

                    {/* Fee Income Section */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <DollarIcon />
                        <span className="font-semibold">{t('admin.users.fees.title')}</span>
                        <span className="badge badge-success">
                          Total: {feeIncome ? `${formatUsd(feeIncome.totalUsdCents)} USD` : '—'}
                        </span>
                        <button className="btn btn-ghost btn-sm ml-auto" disabled={busy} onClick={() => loadFeeIncome(selectedUser.id)}>
                          <RefreshIcon />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
                        {feeIncome && feeIncome.items.length ? (
                          feeIncome.items.map((it) => (
                            <div 
                              key={it.id} 
                              style={{ 
                                padding: 12, 
                                background: 'var(--bg-elevated)', 
                                borderRadius: 8,
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span className="font-mono text-xs text-tertiary">{it.tec}</span>
                                <span className="text-xs text-muted">
                                  {it.createdAt ? new Date(it.createdAt).toLocaleString() : '—'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className="badge badge-success">
                                  +{formatUsd(it.usdCents)} USD
                                </span>
                                <span className="text-xs text-secondary">
                                  From: {it.sourceEmail || (it.sourceUserId ? `#${it.sourceUserId}` : '—')}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted" style={{ padding: 40 }}>
                            {t('admin.users.fees.empty')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statement Section */}
                    <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <FileTextIcon />
                        <span className="font-semibold">{t('admin.users.statement.title') || 'Account Statement'}</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            disabled={busy || statement.length === 0} 
                            onClick={exportStatementToPdf}
                          >
                            <DownloadIcon />
                            {t('admin.users.statement.export') || 'Export'}
                          </button>
                          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => loadStatement(selectedUser.id, 0, statementSize)}>
                            <RefreshIcon />
                          </button>
                        </div>
                      </div>

                      {/* Pagination Size Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span className="text-xs text-tertiary">Items per page:</span>
                        <select 
                          className="input input-sm" 
                          value={statementSize} 
                          onChange={(e) => {
                            const newSize = Number(e.target.value)
                            setStatementSize(newSize)
                            void loadStatement(selectedUser.id, 0, newSize)
                          }}
                          style={{ width: 80 }}
                        >
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                        {statement.length ? (
                          statement.map((tx) => (
                            <div 
                              key={tx.id} 
                              style={{ 
                                padding: 12, 
                                background: 'var(--bg-elevated)', 
                                borderRadius: 8,
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span className="font-mono text-xs text-tertiary">{tx.tec}</span>
                                <span className="badge badge-secondary">{tx.type}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  {tx.usdAmountCents !== null && tx.usdAmountCents !== 0 && (
                                    <span className={`badge ${tx.usdAmountCents >= 0 ? 'badge-success' : 'badge-danger'}`}>
                                      {tx.usdAmountCents >= 0 ? '+' : ''}{formatUsd(tx.usdAmountCents)} USD
                                    </span>
                                  )}
                                  {tx.trvAmountCents !== null && tx.trvAmountCents !== 0 && (
                                    <span className={`badge ${tx.trvAmountCents >= 0 ? 'badge-success' : 'badge-danger'}`}>
                                      {tx.trvAmountCents >= 0 ? '+' : ''}{formatUsd(tx.trvAmountCents)} TRV
                                    </span>
                                  )}
                                  {tx.feeUsdCents !== null && tx.feeUsdCents > 0 && (
                                    <span className="badge badge-warning">
                                      Fee: {formatUsd(tx.feeUsdCents)} USD
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted">
                                  {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted" style={{ padding: 40 }}>
                            {t('admin.users.statement.empty') || 'No transactions found'}
                          </div>
                        )}
                      </div>

                      {/* Pagination */}
                      {statement.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            disabled={busy || statementPage === 0}
                            onClick={() => loadStatement(selectedUser.id, statementPage - 1, statementSize)}
                          >
                            <ChevronLeftIcon />
                            Previous
                          </button>
                          <span className="text-sm text-secondary">
                            Page {statementPage + 1}
                          </span>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            disabled={busy || !statementHasNext}
                            onClick={() => loadStatement(selectedUser.id, statementPage + 1, statementSize)}
                          >
                            Next
                            <ChevronRightIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <UsersIcon />
                  </div>
                  <h3 className="empty-state-title">{t('admin.users.selectUser')}</h3>
                  <p className="empty-state-desc">Select a user from the list to view their details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
