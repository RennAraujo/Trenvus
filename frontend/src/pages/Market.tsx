import { useEffect, useState } from 'react'
import { api, type MarketTicker } from '../api'
import { useAuth } from '../auth'

export function Market() {
  const auth = useAuth()
  const [tickers, setTickers] = useState<MarketTicker[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getMarketTickers(token)
      setTickers(data)
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar mercado')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="grid">
      <div className="col-12">
        <h1 className="title">Mercado</h1>
        <div className="subtitle">Acompanhe preços e variação 24h (fonte pública).</div>
      </div>

      <div className="col-12">
        {error ? <div className="error">{error}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" disabled={busy} onClick={load}>
            {busy ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {tickers.map((t) => {
        const change = t.change24hPercent
        const changeText = change === null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
        const changeStyle =
          change === null
            ? { color: 'var(--muted)' }
            : change >= 0
              ? { color: 'rgba(25,193,201,0.95)' }
              : { color: 'rgba(255,77,109,0.95)' }
        return (
          <div key={t.assetId} className="col-6 card">
            <div className="card-inner">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="muted">Ativo</div>
                  <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>{t.assetId}</div>
                </div>
                <div className="pill">USD</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <div>
                  <div className="muted">Preço</div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                    {t.priceUsd.toFixed(4)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="muted">24h</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 900, marginTop: 6, ...changeStyle }}>
                    {changeText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

