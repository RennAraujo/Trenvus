import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { api, formatUsd, type PrivateStatementItem } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

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

    const nowLabel = formatWhen(new Date().toISOString()) || new Date().toISOString()
    const header = `${t('statement.title')} • ${t('statement.page')} ${page + 1}`

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(header, margin, y)
    y += 18

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(nowLabel, margin, y)
    y += 18

    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(0.6)
    doc.line(margin, y, pageWidth - margin, y)
    y += 16

    const maxTextWidth = pageWidth - margin * 2

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

      const lines = [
        typeLabel(item.type),
        item.tec,
        ...(when ? [when] : []),
        ...(netPrimary ? [formatSigned(netPrimary.currency, netPrimary.cents)] : []),
        ...feeLines,
        ...movementLines,
      ]

      const rendered = doc.splitTextToSize(lines.join('\n'), maxTextWidth)
      const blockHeight = rendered.length * 12 + 14
      if (y + blockHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(typeLabel(item.type), margin, y)
      y += 14

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const rest = doc.splitTextToSize(
        [item.tec, ...(when ? [when] : []), ...(netPrimary ? [formatSigned(netPrimary.currency, netPrimary.cents)] : []), ...feeLines, ...movementLines].join(
          '\n',
        ),
        maxTextWidth,
      )
      doc.text(rest, margin, y)
      y += rest.length * 12 + 10

      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.4)
      doc.line(margin, y, pageWidth - margin, y)
      y += 14
    }

    doc.save(`extrato-pagina-${page + 1}.pdf`)
  }

  async function load(nextPage: number) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getPrivateStatement(token, nextPage, 5)
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
    <div className="grid">
      <div className="col-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 className="title">{t('statement.title')}</h1>
            <div className="subtitle">{t('statement.subtitle')}</div>
          </div>
          <button className="btn" type="button" disabled={busy || items.length === 0} onClick={exportPdf}>
            {t('actions.exportPdf')}
          </button>
        </div>
      </div>

      <div className="col-12 card">
        <div className="card-inner">
          {error ? <div className="error">{error}</div> : null}
          <div className="statement-meta" style={{ marginTop: 10 }}>
            <div className="muted">
              {t('statement.showing', { n: String(items.length) })} {t('statement.transactions')}
            </div>
            <div className="muted">
              {t('statement.page')} {page + 1}
            </div>
          </div>

          <div className="statement-list" style={{ marginTop: 12 }}>
            {items.length === 0 && !busy ? <div className="muted">{t('statement.empty')}</div> : null}
            {items.map((item) => {
              const when = formatWhen(item.createdAt)

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

              return (
                <div key={item.id} className="statement-row">
                  <div className="statement-left">
                    <div className="statement-title">{typeLabel(item.type)}</div>
                    <div className="statement-tec">
                      <span className="mono">{item.tec}</span>
                    </div>
                    {when ? <div className="statement-when">{when}</div> : null}
                  </div>
                  <div className="statement-right">
                    {netPrimary ? (
                      <div className={`statement-net ${netPrimary.cents >= 0 ? 'pos' : 'neg'}`}>
                        {formatSigned(netPrimary.currency, netPrimary.cents)}
                      </div>
                    ) : null}
                    <div className="statement-lines">
                      {lines.map((l) => (
                        <div key={l} className="statement-line">
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="statement-footer">
            <div className="muted">{t('statement.secureNote')}</div>
            <div className="muted">
              {t('statement.rateNote')} {t('statement.feeNote')}
            </div>
          </div>

          <div className="statement-pagination">
            <button className="btn" disabled={busy || page === 0} onClick={() => load(page - 1)}>
              {t('actions.previous')}
            </button>
            <button className="btn" disabled={busy || !hasNext} onClick={() => load(page + 1)}>
              {t('actions.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
