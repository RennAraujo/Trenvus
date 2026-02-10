import { useEffect, useState } from 'react'
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

  async function load(nextPage: number) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getPrivateStatement(token, nextPage, 20)
      setItems(data)
      setPage(nextPage)
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
        <h1 className="title">{t('statement.title')}</h1>
        <div className="subtitle">{t('statement.subtitle')}</div>
      </div>

      <div className="col-12 card">
        <div className="card-inner">
          {error ? <div className="error">{error}</div> : null}
          <div className="list" style={{ marginTop: 10 }}>
            {items.length === 0 && !busy ? <div className="muted">{t('statement.empty')}</div> : null}
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

                    const renderPill = (currency: string, cents: number, accent: boolean) => (
                      <span
                        key={`${currency}:${cents}:${accent ? 'c' : 'd'}`}
                        className={`pill ${accent ? 'pill-accent' : ''}`}
                        style={{ borderColor: accent ? undefined : 'rgba(255,255,255,0.14)' }}
                      >
                        <span className="mono">
                          {formatUsd(cents)} {currency}
                        </span>
                      </span>
                    )

                    return (
                      <>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
                          <div style={{ minWidth: 220, flex: '1 1 260px' as any }}>
                            <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                              {t('statement.credit')}
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                              {credits.length ? credits.map((v) => renderPill(v.currency, v.cents, true)) : (
                                <span className="muted">—</span>
                              )}
                            </div>
                          </div>

                          <div style={{ minWidth: 220, flex: '1 1 260px' as any }}>
                            <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                              {t('statement.debit')}
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                              {debits.length ? debits.map((v) => renderPill(v.currency, Math.abs(v.cents), false)) : (
                                <span className="muted">—</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {net.length ? (
                          <div style={{ marginTop: 10 }}>
                            <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                              {t('statement.net')}
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                              {net.map((v) => renderPill(v.currency, v.cents, v.cents > 0))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <button className="btn" disabled={busy || page === 0} onClick={() => load(page - 1)}>
              {t('actions.previous')}
            </button>
            <button className="btn" disabled={busy} onClick={() => load(page + 1)}>
              {t('actions.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
