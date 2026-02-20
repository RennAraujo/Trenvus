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

export function Statement() {
  const auth = useAuth()
  const { t } = useI18n()
  const [items, setItems] = useState<PrivateStatementItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(0)
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

  function exportPdf() {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40
    let y = margin
    const lineH = 14
    const smallLineH = 12

    const nowLabel = formatWhen(new Date().toISOString()) || new Date().toISOString()
    const header = `${t('statement.title')} • ${t('statement.page')} ${page + 1}`

    function ensureSpace(height: number) {
      if (y + height <= pageHeight - margin) return
      doc.addPage()
      y = margin
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(header, margin, y)
    y += 18

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(nowLabel, margin, y)
    y += 18

    doc.setDrawColor(210, 210, 210)
    doc.setLineWidth(0.6)
    doc.line(margin, y, pageWidth - margin, y)
    y += 16

    for (const item of items) {
      const when = formatWhen(item.createdAt)

      const netByCurrency = new Map<string, number>()
      for (const v of item.values) {
        netByCurrency.set(v.currency, (netByCurrency.get(v.currency) || 0) + v.cents)
      }
      const netEntries = Array.from(netByCurrency.entries())
        .map(([currency, cents]) => ({ currency, cents }))
        .filter((v) => v.cents !== 0)

      const netPrimary =
        netEntries.find((n) => n.currency === 'TRV') || netEntries.find((n) => n.currency === 'USD') || netEntries[0] || null

      const movements = item.values
        .filter((v) => v.cents !== 0)
        .map((v) => ({ currency: v.currency, cents: v.cents, fee: v.fee }))

      const feeLines = movements
        .filter((m) => m.fee)
        .map((m) => `${t('statement.feeLabel')}: ${formatUsd(Math.abs(m.cents))} ${m.currency}`)

      const movementLines = movements
        .filter((m) => !m.fee)
        .sort((a, b) => a.cents - b.cents)
        .map((m) => formatSigned(m.currency, m.cents))

      const detailLines = [...feeLines, ...movementLines]
      ensureSpace(lineH * 2 + (detailLines.length ? detailLines.length * smallLineH : smallLineH) + 18)

      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(typeLabel(item.type), margin, y)
      if (netPrimary) {
        doc.text(netText(netPrimary.cents, netPrimary.currency), pageWidth - margin, y, { align: 'right' })
      }
      y += lineH

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      doc.text(item.tec, margin, y)
      if (when) {
        doc.text(when, pageWidth - margin, y, { align: 'right' })
      }
      y += lineH

      doc.setTextColor(0, 0, 0)
      if (detailLines.length) {
        for (const l of detailLines) {
          ensureSpace(smallLineH + 6)
          doc.text(l, margin + 14, y)
          y += smallLineH
        }
      } else {
        doc.setTextColor(120, 120, 120)
        doc.text('—', margin + 14, y)
        y += smallLineH
      }

      y += 8
      doc.setDrawColor(230, 230, 230)
      doc.setLineWidth(0.6)
      doc.line(margin, y, pageWidth - margin, y)
      y += 14
    }

    const footerLines = [t('statement.secureNote'), `${t('statement.rateNote')} • ${t('statement.feeNote')}`]
    ensureSpace(footerLines.length * smallLineH + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    for (const l of footerLines) {
      doc.text(l, margin, y)
      y += smallLineH
    }

    const ts = new Date()
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const name = `extrato-p${page + 1}-${ts.getFullYear()}${pad2(ts.getMonth() + 1)}${pad2(ts.getDate())}-${pad2(ts.getHours())}${pad2(
      ts.getMinutes(),
    )}.pdf`
    doc.save(name)
  }

  function netText(cents: number, currency: string): string {
    const sign = cents >= 0 ? '+' : '-'
    return `${sign}${formatUsd(Math.abs(cents))} ${currency}`
  }

  async function load(nextPage: number) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getPrivateStatement(token, nextPage, 10)
      const next = await api.getPrivateStatement(token, nextPage + 1, 1)
      setItems(data)
      setPage(nextPage)
      setHasNext(next.length > 0)
    } catch (err: any) {
      setError(err?.message || t('errors.loadStatement'))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void load(0)
  }, [])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">{t('statement.title')}</h1>
            <p className="page-subtitle">{t('statement.subtitle')}</p>
          </div>
          <button 
            className="btn btn-secondary" 
            type="button" 
            disabled={busy || items.length === 0} 
            onClick={exportPdf}
          >
            <DownloadIcon />
            {t('actions.exportPdf')}
          </button>
        </div>
      </div>

      {/* Content */}
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
              <FileTextIcon />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Transaction History</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {items.length > 0 ? `Showing ${items.length} transactions` : 'No transactions'}
              </p>
            </div>
          </div>
          
          {items.length > 0 && (
            <div className="text-sm text-secondary">
              Page {page + 1}
            </div>
          )}
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {error && (
            <div className="alert alert-error" style={{ margin: 24 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {items.length === 0 && !busy ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileTextIcon />
              </div>
              <h3 className="empty-state-title">No transactions yet</h3>
              <p className="empty-state-desc">Your transaction history will appear here once you start using the platform.</p>
            </div>
          ) : (
            <div className="tx-list" style={{ padding: 24 }}>
              {items.map((item, index) => {
                const when = formatWhen(item.createdAt)
                const { Icon, bg, color } = getTxIcon(item.type)

                const netByCurrency = new Map<string, number>()
                for (const v of item.values) {
                  netByCurrency.set(v.currency, (netByCurrency.get(v.currency) || 0) + v.cents)
                }
                const netEntries = Array.from(netByCurrency.entries())
                  .map(([currency, cents]) => ({ currency, cents }))
                  .filter((v) => v.cents !== 0)

                const netPrimary =
                  netEntries.find((n) => n.currency === 'TRV') ||
                  netEntries.find((n) => n.currency === 'USD') ||
                  netEntries[0] ||
                  null

                const movements = item.values
                  .filter((v) => v.cents !== 0)
                  .map((v) => ({ currency: v.currency, cents: v.cents, fee: v.fee }))

                const feeLines = movements
                  .filter((m) => m.fee)
                  .map((m) => `${t('statement.feeLabel')}: ${formatUsd(Math.abs(m.cents))} ${m.currency}`)

                const movementLines = movements
                  .filter((m) => !m.fee)
                  .sort((a, b) => a.cents - b.cents)
                  .map((m) => formatSigned(m.currency, m.cents))

                const lines = [...feeLines, ...movementLines]
                const isPositive = netPrimary ? netPrimary.cents >= 0 : false

                return (
                  <div 
                    key={item.id} 
                    className="tx-item"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div 
                      className="tx-icon" 
                      style={{ background: bg, color }}
                    >
                      <Icon />
                    </div>
                    
                    <div className="tx-details">
                      <div className="tx-title">{typeLabel(item.type)}</div>
                      <div className="tx-meta">
                        <span className="tx-tec">{item.tec}</span>
                        {when && (
                          <>
                            <span>·</span>
                            <span>{when}</span>
                          </>
                        )}
                      </div>
                      {lines.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {lines.map((line, i) => (
                            <span 
                              key={i}
                              style={{ 
                                fontSize: 12, 
                                color: 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <TagIcon />
                              {line}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="tx-amount">
                      {netPrimary && (
                        <>
                          <div className={`tx-amount-value tabular-nums ${isPositive ? 'tx-amount-positive' : 'tx-amount-negative'}`}>
                            {netText(netPrimary.cents, netPrimary.currency)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {items.length > 0 && (
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="text-sm text-secondary">
                <span style={{ verticalAlign: 'middle', marginRight: 6, display: 'inline-block' }}><ShieldIcon /></span>
                {t('statement.secureNote')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  disabled={busy || page === 0} 
                  onClick={() => load(page - 1)}
                >
                  <ChevronLeftIcon />
                  {t('actions.previous')}
                </button>
                <button 
                  className="btn btn-secondary btn-sm" 
                  disabled={busy || !hasNext} 
                  onClick={() => load(page + 1)}
                >
                  {t('actions.next')}
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <p className="text-sm text-muted">
          {t('statement.rateNote')} • {t('statement.feeNote')}
        </p>
      </div>
    </div>
  )
}
