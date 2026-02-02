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
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {item.values.map((v, i) => (
                      <span
                        key={i}
                        className={`pill ${v.cents < 0 ? '' : 'pill-accent'}`}
                        style={{ borderColor: v.cents < 0 ? 'rgba(255,255,255,0.14)' : undefined }}
                      >
                        <span className="mono">
                          {formatUsd(v.cents)} {v.currency}
                        </span>
                      </span>
                    ))}
                  </div>
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

