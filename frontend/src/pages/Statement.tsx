import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { api, formatUsd, type PrivateStatementItem } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { ExportPdfModal } from '../components/ExportPdfModal'

// Icons
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

const DepositIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
  </svg>
)

const ConvertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>
  </svg>
)

const TransferOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

const TransferInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
  </svg>
)

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
)

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const TagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>
  </svg>
)

function getTxIcon(type: string) {
  switch (type) {
    case 'DEPOSIT_USD':
      return { Icon: DepositIcon, bg: 'var(--color-success-alpha-10)', color: 'var(--color-success)', label: 'Deposit' }
    case 'CONVERT_USD_TO_TRV':
    case 'CONVERT_TRV_TO_USD':
      return { Icon: ConvertIcon, bg: 'var(--color-primary-alpha-10)', color: 'var(--color-primary)', label: 'Convert' }
    case 'TRANSFER_TRV_OUT':
      return { Icon: TransferOutIcon, bg: 'var(--color-danger-alpha-10)', color: 'var(--color-danger)', label: 'Sent' }
    case 'TRANSFER_TRV_IN':
      return { Icon: TransferInIcon, bg: 'var(--color-success-alpha-10)', color: 'var(--color-success)', label: 'Received' }
    case 'FEE_INCOME_USD':
      return { Icon: DepositIcon, bg: 'var(--color-secondary-alpha-10)', color: 'var(--color-secondary-light)', label: 'Fee' }
    case 'ADMIN_ADJUST_WALLET':
      return { Icon: FileTextIcon, bg: 'var(--bg-subtle)', color: 'var(--text-secondary)', label: 'Admin' }
    default:
      return { Icon: FileTextIcon, bg: 'var(--bg-subtle)', color: 'var(--text-secondary)', label: 'Transaction' }
  }
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const
type PageSize = typeof PAGE_SIZE_OPTIONS[number]

export function Statement() {
  const auth = useAuth()
  const { t } = useI18n()
  const [items, setItems] = useState<PrivateStatementItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<PageSize>(20)
  const [hasNext, setHasNext] = useState(false)
  
  // PDF export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [pdfData, setPdfData] = useState<string | null>(null)
  const [pdfFileName, setPdfFileName] = useState('statement.pdf')

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

  const locale = useMemo(() => {
    return (
      (typeof window !== 'undefined' ? window.localStorage.getItem('exchange.locale') : null) ||
      (typeof navigator !== 'undefined' ? navigator.language : 'en')
    )
  }, [])

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

  function formatSigned(currency: string, cents: number): string {
    const sign = cents >= 0 ? '+' : '-'
    return `${sign}${formatUsd(Math.abs(cents))} ${currency}`
  }

  // Trenvus Logo as SVG path for PDF
  function addTrenvusLogo(doc: jsPDF, x: number, y: number, height: number) {
    const scale = height / 40
    
    // Draw the building/shape part of logo (blue gradient representation)
    doc.setFillColor(0, 102, 204) // Blue color
    
    // Left tall building
    doc.triangle(x + 5*scale, y + 35*scale, x + 15*scale, y + 35*scale, x + 15*scale, y + 5*scale, 'F')
    doc.triangle(x + 5*scale, y + 35*scale, x + 5*scale, y + 15*scale, x + 15*scale, y + 5*scale, 'F')
    
    // Middle building
    doc.setFillColor(0, 136, 255)
    doc.triangle(x + 18*scale, y + 35*scale, x + 28*scale, y + 35*scale, x + 28*scale, y + 12*scale, 'F')
    doc.triangle(x + 18*scale, y + 35*scale, x + 18*scale, y + 22*scale, x + 28*scale, y + 12*scale, 'F')
    
    // Right building
    doc.setFillColor(51, 153, 255)
    doc.triangle(x + 31*scale, y + 35*scale, x + 42*scale, y + 35*scale, x + 42*scale, y + 20*scale, 'F')
    doc.triangle(x + 31*scale, y + 35*scale, x + 31*scale, y + 28*scale, x + 42*scale, y + 20*scale, 'F')
    
    // Draw text "TRENVUS"
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24 * scale)
    doc.setTextColor(0, 0, 0)
    doc.text('TRENVUS', x + 50*scale, y + 28*scale)
  }

  function exportPdf() {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40
    let y = 110

    const now = new Date()
    const nowLabel = formatWhen(now.toISOString()) || now.toISOString()
    
    // Get wallet balances from current state
    const wallet = items.length > 0 ? { usdCents: 0, trvCents: 0 } : { usdCents: 0, trvCents: 0 }
    
    // Calculate totals from items
    let totalUsd = 0, totalTrv = 0
    for (const item of items) {
      for (const v of item.values) {
        if (!v.fee) {
          if (v.currency === 'USD') totalUsd += v.cents
          else if (v.currency === 'TRV') totalTrv += v.cents
        }
      }
    }

    function ensureSpace(height: number) {
      if (y + height <= pageHeight - margin - 60) return
      doc.addPage()
      addHeader()
      y = 80
    }

    function addHeader() {
      // Dark navy header background
      doc.setFillColor(20, 20, 40)
      doc.rect(0, 0, pageWidth, 90, 'F')
      
      // Decorative geometric shapes on right
      doc.setFillColor(124, 58, 237)
      doc.triangle(pageWidth - 150, 0, pageWidth, 0, pageWidth, 70, 'F')
      doc.setFillColor(200, 50, 80)
      doc.triangle(pageWidth - 80, 0, pageWidth - 30, 0, pageWidth - 55, 45, 'F')
      
      // Trenvus Logo Text (stylized)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      doc.setTextColor(255, 255, 255)
      doc.text('TRENVUS', margin, 55)
      
      // Purple accent line under logo
      doc.setFillColor(124, 58, 237)
      doc.rect(margin, 62, 80, 3, 'F')
      
      // Document title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(26)
      doc.setTextColor(255, 255, 255)
      doc.text('EXTRATO', pageWidth - margin, 50, { align: 'right' })
      
      // Reference and date - better contrast
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(200, 200, 220)
      const refText = `Ref: TEC-${now.getTime().toString().slice(-10)}`
      doc.text(refText, pageWidth - margin, 68, { align: 'right' })
      doc.text(`Data: ${nowLabel}`, pageWidth - margin, 82, { align: 'right' })
    }

    function addFooter(pageNum: number, totalPages: number) {
      // Dark footer
      doc.setFillColor(20, 20, 40)
      doc.rect(0, pageHeight - 45, pageWidth, 45, 'F')
      
      // Contact info
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(180, 180, 200)
      doc.text('Trenvus © 2026 · trenvus.com · contato@trenvus.com', margin, pageHeight - 20)
      
      // Page number
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 20, { align: 'right' })
    }

    // First page header
    addHeader()

    // Balance Section - USD and TRV cards
    y += 20
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 80)
    doc.text('Saldos Atuais', margin, y)
    y += 25

    // Balance cards side by side
    const cardWidth = (pageWidth - margin * 2 - 20) / 2
    
    // USD Balance Card
    doc.setFillColor(245, 248, 255)
    doc.roundedRect(margin, y, cardWidth, 75, 6, 6, 'F')
    // Blue accent line
    doc.setFillColor(59, 130, 246)
    doc.rect(margin, y + 70, cardWidth, 5, 'F')
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 120)
    doc.text('Saldo USD', margin + 15, y + 28)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(59, 130, 246)
    const totalUsdFormatted = formatUsd(Math.abs(totalUsd))
    doc.text(`${totalUsd >= 0 ? '+' : '-'}${totalUsdFormatted}`, margin + 15, y + 55)
    
    // TRV Balance Card
    doc.setFillColor(250, 245, 255)
    doc.roundedRect(margin + cardWidth + 20, y, cardWidth, 75, 6, 6, 'F')
    // Purple accent line
    doc.setFillColor(124, 58, 237)
    doc.rect(margin + cardWidth + 20, y + 70, cardWidth, 5, 'F')
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 120)
    doc.text('Saldo TRV', margin + cardWidth + 35, y + 28)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(124, 58, 237)
    const totalTrvFormatted = formatUsd(Math.abs(totalTrv))
    doc.text(`${totalTrv >= 0 ? '+' : '-'}${totalTrvFormatted}`, margin + cardWidth + 35, y + 55)
    
    y += 95

    // Transactions Section Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 80)
    doc.text('Histórico de Transações', margin, y)
    y += 20

    // Transactions Table Header
    const tableWidth = pageWidth - margin * 2
    doc.setFillColor(30, 30, 50)
    doc.roundedRect(margin, y, tableWidth, 32, 3, 3, 'F')
    // Purple accent bar at bottom of header
    doc.setFillColor(124, 58, 237)
    doc.rect(margin, y + 27, tableWidth, 5, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('Data/Hora', margin + 12, y + 19)
    doc.text('Tipo / Descrição', margin + 110, y + 19)
    doc.text('Valor', pageWidth - margin - 12, y + 19, { align: 'right' })
    
    y += 42

    // Transactions rows
    let rowIndex = 0
    for (const item of items) {
      ensureSpace(45)
      
      // Alternating row background
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 252)
        doc.roundedRect(margin, y - 4, tableWidth, 38, 2, 2, 'F')
      }
      
      // Date
      const dateStr = formatWhen(item.createdAt?.toString() || null) || '-'
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 100)
      doc.text(dateStr, margin + 12, y + 12)
      
      // Type - truncated if too long
      let typeText = typeLabel(item.type)
      if (item.type === 'TRANSFER_TRV_IN' && item.senderNickname) {
        typeText += ` de ${item.senderNickname}`
      } else if (item.type === 'TRANSFER_TRV_OUT' && item.recipientNickname) {
        typeText += ` para ${item.recipientNickname}`
      }
      
      // Truncate long text
      if (typeText.length > 38) {
        typeText = typeText.substring(0, 35) + '...'
      }
      
      // Type color based on transaction type
      let typeColor = [80, 80, 100]
      if (item.type === 'TRANSFER_TRV_IN') typeColor = [16, 185, 129]
      else if (item.type === 'TRANSFER_TRV_OUT') typeColor = [239, 68, 68]
      else if (item.type === 'DEPOSIT_USD') typeColor = [59, 130, 246]
      else if (item.type.includes('CONVERT')) typeColor = [124, 58, 237]
      
      doc.setTextColor(typeColor[0], typeColor[1], typeColor[2])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(typeText, margin + 110, y + 12)
      
      // TEC reference - darker for visibility
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 140)
      doc.text(item.tec, margin + 110, y + 26)
      
      // Values
      let valueY = y
      for (const v of item.values) {
        const valueText = formatSigned(v.currency, v.cents)
        
        if (v.fee) {
          doc.setTextColor(140, 140, 160)
          doc.setFontSize(7)
          doc.text(`${valueText} (taxa)`, pageWidth - margin - 12, valueY + 10, { align: 'right' })
        } else {
          if (v.cents >= 0) {
            doc.setTextColor(16, 185, 129)
          } else {
            doc.setTextColor(239, 68, 68)
          }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.text(valueText, pageWidth - margin - 12, valueY + 12, { align: 'right' })
        }
        
        valueY += 13
      }
      
      y = Math.max(y + 32, valueY + 5)
      rowIndex++
    }

    // Calculate total pages and add footers
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter(i, totalPages)
    }

    // Store PDF data and open modal
    const pdfOutput = doc.output('datauristring')
    const fileName = `trenvus-extrato-${now.toISOString().split('T')[0]}.pdf`
    setPdfData(pdfOutput)
    setPdfFileName(fileName)
    setIsExportModalOpen(true)
  }

  function handleDownloadPdf() {
    if (pdfData) {
      const link = document.createElement('a')
      link.href = pdfData
      link.download = pdfFileName
      link.click()
    }
  }

  async function load() {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getPrivateStatement(token, page, pageSize)
      setItems(data.items)
      setHasNext(data.hasNext)
    } catch (err: any) {
      setError(err?.message || t('errors.loadStatement'))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, pageSize])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">{t('statement.title')}</h1>
            <p className="page-subtitle">{t('statement.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-secondary btn-icon" 
              onClick={load} 
              disabled={busy}
              title="Refresh"
            >
              <RefreshIcon />
            </button>
            <button 
              className="btn btn-primary" 
              onClick={exportPdf}
              disabled={items.length === 0}
            >
              <DownloadIcon />
              <span style={{ marginLeft: 8 }}>{t('actions.exportPdf')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Size Selector */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 20,
        padding: '12px 16px',
        background: 'var(--bg-subtle)',
        borderRadius: 8,
        border: '1px solid var(--border-subtle)'
      }}>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('statement.itemsPerPage')}:
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value) as PageSize)
            setPage(0) // Reset to first page when changing size
          }}
          className="input"
          style={{ width: 'auto', minWidth: 80 }}
          disabled={busy}
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Transactions List */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {items.length === 0 && !busy && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              {t('statement.empty')}
            </div>
          )}

          {items.map((item, idx) => {
            const { Icon, bg, color } = getTxIcon(item.type)
            return (
              <div 
                key={item.id ?? idx} 
                className="tx-item"
                style={{ 
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 10, 
                    background: bg,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>
                      {typeLabel(item.type)}
                      {item.type === 'TRANSFER_TRV_IN' && item.senderNickname && (
                        <span style={{ color: 'var(--color-success)', marginLeft: 6 }}>
                          de {item.senderNickname}
                        </span>
                      )}
                      {item.type === 'TRANSFER_TRV_OUT' && item.recipientNickname && (
                        <span style={{ color: 'var(--color-danger)', marginLeft: 6 }}>
                          para {item.recipientNickname}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TagIcon />
                        {item.tec}
                      </span>
                      <span>·</span>
                      <span>{formatWhen(item.createdAt?.toString() || null)}</span>
                    </div>
                  </div>
                </div>

                <div className="tx-amount" style={{ textAlign: 'right' }}>
                  {item.values.map((v, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        fontSize: 14, 
                        fontWeight: 500,
                        color: v.fee ? 'var(--text-muted)' : (v.cents >= 0 ? 'var(--color-success)' : 'var(--text-primary)'),
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {formatSigned(v.currency, v.cents)}
                      {v.fee && <span style={{ fontSize: 11, marginLeft: 4 }}>({t('statement.fee')})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pagination */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginTop: 24,
        padding: '16px 20px',
        background: 'var(--bg-subtle)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)'
      }}>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('statement.showing', { n: items.length })} {t('statement.transactions')}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || busy}
          >
            <ChevronLeftIcon />
          </button>
          
          <span className="text-sm" style={{ fontWeight: 500 }}>
            {t('statement.page')} {page + 1}
          </span>
          
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setPage(p => p + 1)}
            disabled={!hasNext || busy}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldIcon />
          {t('statement.secureNote')}
        </p>
        <p className="text-sm text-secondary" style={{ marginTop: 8 }}>
          {t('statement.rateNote')}
        </p>
        <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
          {t('statement.feeNote')}
        </p>
      </div>

      {/* Export PDF Modal */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onDownload={handleDownloadPdf}
        pdfData={pdfData}
        fileName={pdfFileName}
      />
    </div>
  )
}