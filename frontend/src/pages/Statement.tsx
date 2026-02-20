import { useEffect, useState } from 'react'
import { api, formatUsd, type PrivateStatementItem } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
)

      const netByCurrency = new Map<string, number>()
      for (const v of item.values) {
        netByCurrency.set(v.currency, (netByCurrency.get(v.currency) || 0) + v.cents)
      }
      const netEntries = Array.from(netByCurrency.entries())
        .map(([currency, cents]) => ({ currency, cents }))
      const data = await api.getPrivateStatement(token, nextPage, 20)
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
        <h1 className="title">{t('statement.title')}</h1>
        <div className="subtitle">{t('statement.subtitle')}</div>
      y += lineH

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
          <div className="list" style={{ marginTop: 10 }}>
          doc.text(l, margin + 14, y)
            {items.map((item, idx) => (
              <div key={idx} className="card" style={{ boxShadow: 'none' }}>
                <div className="card-inner" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div className="mono" style={{ fontSize: 12, opacity: 0.82 }}>
                      {t('statement.tec')}: {item.tec}
                    </div>
                    {item.createdAt ? (
                      <div className="mono" style={{ fontSize: 12, opacity: 0.62 }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    ) : null}
                  </div>

                  {(() => {
                    const credits = item.values.filter((v) => v.cents > 0)
                    const debits = item.values.filter((v) => v.cents < 0)
                    const netByCurrency = new Map<string, number>()
                    for (const v of item.values) {
                      netByCurrency.set(v.currency, (netByCurrency.get(v.currency) || 0) + v.cents)
                    }
                    const net = Array.from(netByCurrency.entries())
                      .map(([currency, cents]) => ({ currency, cents }))
                      .filter((v) => v.cents !== 0)
                      .sort((a, b) => a.currency.localeCompare(b.currency))

                    const renderPill = (currency: string, cents: number, accent: boolean, fee: boolean) => (
                      <span
                        key={`${currency}:${cents}:${accent ? 'c' : 'd'}:${fee ? 'f' : 'n'}`}
                        className={`pill ${accent ? 'pill-accent' : ''}`}
                        style={{ borderColor: accent ? undefined : 'rgba(255,255,255,0.14)' }}
                      >
                        <span className="mono">
                          {fee ? `${t('statement.fee')}: ` : ''}
                          {formatUsd(cents)} {currency}
                        </span>
                      </span>
                    )
  }
                    return (
                      <>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
                          <div style={{ minWidth: 220, flex: '1 1 260px' as any }}>
                            <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                              {t('statement.credit')}
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                              {credits.length ? credits.map((v) => renderPill(v.currency, v.cents, true, v.fee)) : (
                                <span className="muted">—</span>
                              )}
                            </div>
                          </div>

                          <div style={{ minWidth: 220, flex: '1 1 260px' as any }}>
                            <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                              {t('statement.debit')}
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                              {debits.length ? debits.map((v) => renderPill(v.currency, Math.abs(v.cents), false, v.fee)) : (
                                <span className="muted">—</span>
                              )}
                            </div>
                          </div>
      setBusy(false)

                        {net.length ? (
                          <div style={{ marginTop: 10 }}>
                            <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                              {t('statement.net')}
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                              {net.map((v) => renderPill(v.currency, v.cents, v.cents > 0, false))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )
                  })()}
  useEffect(() => {
              </div>
            ))}
            <h1 className="page-title">{t('statement.title')}</h1>
            <p className="page-subtitle">{t('statement.subtitle')}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
          <button 
            className="btn btn-secondary" 
            type="button" 
            <button className="btn" disabled={busy} onClick={() => load(page + 1)}>
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
