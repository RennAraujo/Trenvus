import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { api, formatUsd, type PrivateStatementItem } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
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
    let y = margin

    const now = new Date()
    const nowLabel = formatWhen(now.toISOString()) || now.toISOString()
    
    // Calculate totals
    let totalUsdIn = 0, totalUsdOut = 0
    let totalTrvIn = 0, totalTrvOut = 0
    
    for (const item of items) {
      for (const v of item.values) {
        if (v.currency === 'USD') {
          if (v.cents > 0) totalUsdIn += v.cents
          else totalUsdOut += Math.abs(v.cents)
        } else if (v.currency === 'TRV') {
          if (v.cents > 0) totalTrvIn += v.cents
          else totalTrvOut += Math.abs(v.cents)
        }
      }
    }

    function ensureSpace(height: number) {
      if (y + height <= pageHeight - margin) return
      doc.addPage()
      addHeader()
      y = 100
    }

    function addHeader() {
      // Logo
      addTrenvusLogo(doc, margin, 30, 30)
      
      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(0, 0, 0)
      doc.text(t('statement.pdf.title'), margin, 90)
      
      // Date
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`${t('statement.pdf.generated')}: ${nowLabel}`, margin, 105)
    }

    function addFooter(pageNum: number, totalPages: number) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text(`${t('statement.pdf.page')} ${pageNum} ${t('statement.pdf.of')} ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' })
    }

    // First page header
    addHeader()
    y = 120

    // Summary Section
    doc.setFillColor(245, 245, 250)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 80, 4, 4, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(t('statement.pdf.summary'), margin + 10, y + 20)
    
    // Summary content
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    
    const col1 = margin + 10
    const col2 = margin + 180
    const col3 = margin + 350
    
    doc.text(`${t('statement.pdf.usdIn')}:`, col1, y + 40)
    doc.text(`${t('statement.pdf.usdOut')}:`, col1, y + 55)
    doc.text(`${t('statement.pdf.trvIn')}:`, col2, y + 40)
    doc.text(`${t('statement.pdf.trvOut')}:`, col2, y + 55)
    doc.text(`${t('statement.pdf.total')}:`, col3, y + 40)
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(`+${formatUsd(totalUsdIn)} USD`, col1 + 70, y + 40)
    doc.text(`-${formatUsd(totalUsdOut)} USD`, col1 + 70, y + 55)
    doc.text(`+${formatUsd(totalTrvIn)} TRV`, col2 + 70, y + 40)
    doc.text(`-${formatUsd(totalTrvOut)} TRV`, col2 + 70, y + 55)
    
    const totalNet = totalUsdIn - totalUsdOut + totalTrvIn - totalTrvOut
    doc.text(formatUsd(Math.abs(totalNet)), col3 + 50, y + 40)
    
    y += 100

    // Transactions Table Header
    doc.setFillColor(0, 102, 204)
    doc.rect(margin, y, pageWidth - margin * 2, 25, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(t('statement.pdf.date'), margin + 10, y + 16)
    doc.text(t('statement.pdf.type'), margin + 120, y + 16)
    doc.text(t('statement.pdf.values'), margin + 280, y + 16)
    
    y += 35

    // Transactions
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    
    for (const item of items) {
      ensureSpace(40)
      
      // Date
      const dateStr = formatWhen(item.createdAt?.toString() || null) || '-'
      doc.setFontSize(8)
      doc.text(dateStr, margin + 10, y)
      
      // Type
      doc.setFontSize(9)
      doc.text(typeLabel(item.type), margin + 120, y)
      
      // Values
      let valueY = y
      for (const v of item.values) {
        const valueText = formatSigned(v.currency, v.cents)
        
        if (v.fee) {
          doc.setTextColor(150, 150, 150)
          doc.setFontSize(8)
          doc.text(`${valueText} (${t('statement.fee').toLowerCase()})`, margin + 280, valueY)
        } else {
          doc.setTextColor(v.cents >= 0 ? 0 : 200, v.cents >= 0 ? 150 : 0, 0)
          doc.setFontSize(9)
          doc.text(valueText, margin + 280, valueY)
        }
        
        valueY += 12
      }
      
      doc.setTextColor(0, 0, 0)
      y = Math.max(y + 25, valueY + 5)
      
      // Separator line
      if (y < pageHeight - margin - 50) {
        doc.setDrawColor(230, 230, 230)
        doc.line(margin, y - 5, pageWidth - margin, y - 5)
      }
    }

    // Calculate total pages and add footers
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter(i, totalPages)
    }

    doc.save(`trenvus-statement-${now.toISOString().split('T')[0]}.pdf`)
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
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{typeLabel(item.type)}</div>
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
    </div>
  )
}