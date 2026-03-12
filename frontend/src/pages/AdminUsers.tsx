import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { api, formatUsd, type AdminFeeIncomeResponse, type AdminUserSummary, type AdminStatementItem } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import logoPdf from '../assets/logo-pdf.png'

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
  const { t, locale } = useI18n()

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

  function userLabel(nickname: string | null, email: string | null, id: number | null): string {
    return nickname || email || (id != null ? `#${id}` : '—')
  }

  function typeLabel(type: string): string {
    if (type === 'DEPOSIT_USD') return t('statement.type.deposit')
    if (type === 'CONVERT_USD_TO_TRV') return t('statement.type.convertUsdToTrv')
    if (type === 'CONVERT_TRV_TO_USD') return t('statement.type.convertTrvToUsd')
    if (type === 'TRANSFER_TRV_OUT') return t('statement.type.transferOut')
    if (type === 'TRANSFER_TRV_IN') return t('statement.type.transferIn')
    if (type === 'FEE_INCOME_USD') return t('statement.type.feeIncome')
    if (type === 'ADMIN_ADJUST_WALLET') return t('statement.type.adminAdjust')
    return type
  }

  function formatWhen(value: string | null): string | null {
    if (!value) return null
    try {
      const d = new Date(value)
      return new Intl.DateTimeFormat(locale === 'pt-BR' || locale === 'en' ? locale : 'en', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
        .format(d)
        .replace(',', ' ·')
    } catch {
      return value
    }
  }

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

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40
    let y = 110

    const now = new Date()
    const nowLabel = formatWhen(now.toISOString()) || now.toISOString()

    let totalUsd = 0, totalTrv = 0
    for (const tx of statement) {
      if (tx.usdAmountCents) totalUsd += tx.usdAmountCents
      if (tx.trvAmountCents) totalTrv += tx.trvAmountCents
    }

    function formatSigned(currency: string, cents: number): string {
      const sign = cents >= 0 ? '+' : '-'
      return `${sign}${formatUsd(Math.abs(cents))} ${currency}`
    }

    function ensureSpace(height: number) {
      if (y + height <= pageHeight - margin - 60) return
      doc.addPage()
      addHeader()
      y = 80
    }

    function addHeader() {
      doc.setFillColor(20, 20, 40)
      doc.rect(0, 0, pageWidth, 90, 'F')

      doc.setFillColor(124, 58, 237)
      doc.triangle(pageWidth - 150, 0, pageWidth, 0, pageWidth, 70, 'F')
      doc.setFillColor(200, 50, 80)
      doc.triangle(pageWidth - 80, 0, pageWidth - 30, 0, pageWidth - 55, 45, 'F')

      try {
        doc.addImage(logoPdf, 'PNG', margin, 20, 45, 45)
      } catch {
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      doc.setTextColor(255, 255, 255)
      doc.text('TRENVUS', margin + 55, 55)

      doc.setFillColor(124, 58, 237)
      doc.rect(margin + 55, 62, 80, 3, 'F')

      const title = (t('statement.pdf.title') || 'STATEMENT').toUpperCase()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(26)
      doc.setTextColor(255, 255, 255)
      doc.text(title, pageWidth - margin, 50, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(200, 200, 220)
      const refText = `Ref: TEC-${now.getTime().toString().slice(-10)}`
      doc.text(refText, pageWidth - margin, 68, { align: 'right' })
      doc.text(`${t('statement.pdf.generated')}: ${nowLabel}`, pageWidth - margin, 82, { align: 'right' })
    }

    function addFooter(pageNum: number, totalPages: number) {
      doc.setFillColor(20, 20, 40)
      doc.rect(0, pageHeight - 45, pageWidth, 45, 'F')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(180, 180, 200)
      doc.text('Trenvus © 2026 · trenvus.com · contato@trenvus.com', margin, pageHeight - 20)

      doc.text(
        t('admin.users.statement.pdf.pageOf', { page: pageNum, total: totalPages }),
        pageWidth - margin,
        pageHeight - 20,
        { align: 'right' },
      )
    }

    addHeader()

    y += 10
    doc.setFillColor(248, 248, 252)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 58, 8, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 80)
    doc.text(`${t('admin.users.statement.pdf.user')}:`, margin + 14, y + 22)
    doc.text(`${t('admin.users.statement.pdf.email')}:`, margin + 14, y + 40)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 100)
    doc.text(userName, margin + 80, y + 22)
    doc.text(userEmail, margin + 80, y + 40)
    y += 78

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 80)
    doc.text(t('statement.pdf.summary'), margin, y)
    y += 25

    const cardWidth = (pageWidth - margin * 2 - 20) / 2

    doc.setFillColor(245, 248, 255)
    doc.roundedRect(margin, y, cardWidth, 75, 6, 6, 'F')
    doc.setFillColor(59, 130, 246)
    doc.rect(margin, y + 70, cardWidth, 5, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 120)
    doc.text(t('statement.pdf.usdIn'), margin + 15, y + 28)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(59, 130, 246)
    doc.text(`${totalUsd >= 0 ? '+' : '-'}${formatUsd(Math.abs(totalUsd))}`, margin + 15, y + 55)

    doc.setFillColor(250, 245, 255)
    doc.roundedRect(margin + cardWidth + 20, y, cardWidth, 75, 6, 6, 'F')
    doc.setFillColor(124, 58, 237)
    doc.rect(margin + cardWidth + 20, y + 70, cardWidth, 5, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 120)
    doc.text(t('statement.pdf.trvIn'), margin + cardWidth + 35, y + 28)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(124, 58, 237)
    doc.text(`${totalTrv >= 0 ? '+' : '-'}${formatUsd(Math.abs(totalTrv))}`, margin + cardWidth + 35, y + 55)

    y += 95

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 80)
    doc.text(t('statement.movements'), margin, y)
    y += 20

    const tableWidth = pageWidth - margin * 2
    doc.setFillColor(30, 30, 50)
    doc.roundedRect(margin, y, tableWidth, 32, 3, 3, 'F')
    doc.setFillColor(124, 58, 237)
    doc.rect(margin, y + 27, tableWidth, 5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(t('statement.pdf.date'), margin + 12, y + 19)
    doc.text(t('statement.pdf.type'), margin + 160, y + 19)
    doc.text(t('statement.pdf.values'), pageWidth - margin - 12, y + 19, { align: 'right' })
    y += 42

    let rowIndex = 0
    for (const tx of statement) {
      ensureSpace(45)

      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 252)
        doc.roundedRect(margin, y - 4, tableWidth, 38, 2, 2, 'F')
      }

      const dateStr = formatWhen(tx.createdAt) || '-'
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 100)
      doc.text(dateStr, margin + 12, y + 12)

      let typeText = typeLabel(tx.type)
      const isTransfer = tx.type === 'TRANSFER_TRV_IN' || tx.type === 'TRANSFER_TRV_OUT'
      if (isTransfer) {
        const from = userLabel(tx.sourceNickname, tx.sourceEmail, tx.sourceUserId)
        const to = userLabel(tx.targetNickname, tx.targetEmail, tx.targetUserId)
        typeText += ` ${t('statement.transfer.from', { name: from })} ${t('statement.transfer.to', { name: to })}`
      }
      if (typeText.length > 42) typeText = typeText.substring(0, 39) + '...'

      let typeColor = [80, 80, 100]
      if (tx.type === 'TRANSFER_TRV_IN') typeColor = [16, 185, 129]
      else if (tx.type === 'TRANSFER_TRV_OUT') typeColor = [239, 68, 68]
      else if (tx.type === 'DEPOSIT_USD') typeColor = [59, 130, 246]
      else if (tx.type.includes('CONVERT')) typeColor = [124, 58, 237]

      doc.setTextColor(typeColor[0], typeColor[1], typeColor[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(typeText, margin + 160, y + 12)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 140)
      doc.text(tx.tec, margin + 160, y + 26)

      let valueY = y
      const values: Array<{ currency: string; cents: number; fee: boolean }> = []
      if (tx.usdAmountCents !== null && tx.usdAmountCents !== 0) values.push({ currency: 'USD', cents: tx.usdAmountCents, fee: false })
      if (tx.trvAmountCents !== null && tx.trvAmountCents !== 0) values.push({ currency: 'TRV', cents: tx.trvAmountCents, fee: false })
      if (tx.feeUsdCents !== null && tx.feeUsdCents > 0) values.push({ currency: 'USD', cents: -tx.feeUsdCents, fee: true })

      for (const v of values) {
        const valueText = formatSigned(v.currency, v.cents)
        if (v.fee) {
          doc.setTextColor(140, 140, 160)
          doc.setFontSize(7)
          doc.text(`${valueText} (${t('statement.fee')})`, pageWidth - margin - 12, valueY + 10, { align: 'right' })
        } else {
          if (v.cents >= 0) doc.setTextColor(16, 185, 129)
          else doc.setTextColor(239, 68, 68)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.text(valueText, pageWidth - margin - 12, valueY + 12, { align: 'right' })
        }
        valueY += 13
      }

      y = Math.max(y + 32, valueY + 5)
      rowIndex++
    }

    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter(i, totalPages)
    }

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
                          {t('admin.users.fees.total')}: {feeIncome ? `${formatUsd(feeIncome.totalUsdCents)} USD` : '—'}
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
                                  {formatWhen(it.createdAt) || '—'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className="badge badge-success">
                                  +{formatUsd(it.usdCents)} USD
                                </span>
                                <span className="text-xs text-secondary">
                                  {t('admin.users.fees.source')}: {it.sourceEmail || (it.sourceUserId ? `#${it.sourceUserId}` : '—')}
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
                        <span className="font-semibold">{t('admin.users.statement.title')}</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            disabled={busy || statement.length === 0} 
                            onClick={exportStatementToPdf}
                          >
                            <DownloadIcon />
                            {t('admin.users.statement.export')}
                          </button>
                          <button className="btn btn-ghost btn-sm" title={t('actions.refresh')} disabled={busy} onClick={() => loadStatement(selectedUser.id, 0, statementSize)}>
                            <RefreshIcon />
                          </button>
                        </div>
                      </div>

                      {/* Pagination Size Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span className="text-xs text-tertiary">{t('statement.itemsPerPage')}:</span>
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
                                <span className="badge badge-secondary" title={tx.type}>{typeLabel(tx.type)}</span>
                              </div>
                              {(tx.type === 'TRANSFER_TRV_IN' || tx.type === 'TRANSFER_TRV_OUT') && (
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                  <span>{t('statement.transfer.from', { name: userLabel(tx.sourceNickname, tx.sourceEmail, tx.sourceUserId) })}</span>
                                  <span>·</span>
                                  <span>{t('statement.transfer.to', { name: userLabel(tx.targetNickname, tx.targetEmail, tx.targetUserId) })}</span>
                                </div>
                              )}
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
                                      {t('statement.fee')}: {formatUsd(tx.feeUsdCents)} USD
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted">
                                  {formatWhen(tx.createdAt) || '—'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted" style={{ padding: 40 }}>
                            {t('admin.users.statement.empty')}
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
                            {t('actions.previous')}
                          </button>
                          <span className="text-sm text-secondary">
                            {t('statement.pdf.page')} {statementPage + 1}
                          </span>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            disabled={busy || !statementHasNext}
                            onClick={() => loadStatement(selectedUser.id, statementPage + 1, statementSize)}
                          >
                            {t('actions.next')}
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
                  <p className="empty-state-desc">{t('admin.users.selectUserDesc')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
