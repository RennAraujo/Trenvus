import { useEffect, useMemo, useRef, useState } from 'react'
import { api, type CandlePoint, type MarketTicker, type OrderBook } from '../api'
import { useAuth } from '../auth'

export function Market() {
  const auth = useAuth()
  const [tickers, setTickers] = useState<MarketTicker[]>([])
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null)
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [candlesByInstId, setCandlesByInstId] = useState<Record<string, CandlePoint[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refreshInFlightRef = useRef(false)
  const selectedInstIdRef = useRef<string | null>(null)
  const refreshIntervalMs = 10_000

  useEffect(() => {
    selectedInstIdRef.current = selectedInstId
  }, [selectedInstId])

  async function refreshAll() {
    if (refreshInFlightRef.current) return
    refreshInFlightRef.current = true
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getMarketTickers(token)
      setTickers(data)

      const candleResults = await Promise.allSettled(
        data.map(async (t) => ({ instId: t.instId, candles: await api.getMarketCandles(token, t.instId, '1H', 24) })),
      )
      setCandlesByInstId((prev) => {
        const next = { ...prev }
        for (const r of candleResults) {
          if (r.status === 'fulfilled') {
            next[r.value.instId] = r.value.candles
          }
        }
        return next
      })

      let instId = selectedInstIdRef.current
      if (!instId && data.length > 0) {
        instId = data[0].instId
        setSelectedInstId(instId)
      }

      if (instId) {
        const ob = await api.getMarketOrderBook(token, instId, 10)
        setOrderBook(ob)
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar mercado')
    } finally {
      setBusy(false)
      refreshInFlightRef.current = false
    }
  }

  async function refreshOrderBook(instId: string) {
    if (refreshInFlightRef.current) return
    refreshInFlightRef.current = true
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getMarketOrderBook(token, instId, 10)
      setOrderBook(data)
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar livro de ofertas')
    } finally {
      setBusy(false)
      refreshInFlightRef.current = false
    }
  }

  useEffect(() => {
    void refreshAll()
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshAll()
    }, refreshIntervalMs)
    return () => window.clearInterval(id)
  }, [])

  const selectedTicker = useMemo(() => {
    if (!selectedInstId) return null
    return tickers.find((t) => t.instId === selectedInstId) || null
  }, [selectedInstId, tickers])

  const stats = useMemo(() => {
    const t = selectedTicker
    if (!t) return null
    const bid = t.bidUsd ?? null
    const ask = t.askUsd ?? null
    const spread = bid !== null && ask !== null ? ask - bid : null
    return { bid, ask, spread }
  }, [selectedTicker])

  function fmtUsd(v: number | null, decimals = 4): string {
    if (v === null) return '—'
    return v.toFixed(decimals)
  }

  function buildSparklineSvg(points: CandlePoint[], id: string, width = 132, height = 40): React.ReactNode {
    const placeholderStyle: React.CSSProperties = {
      width,
      height,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
    }

    if (!points || points.length < 2) return <div style={placeholderStyle} />

    const values = points.map((p) => p.closeUsd)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const first = values[0]
    const last = values[values.length - 1]
    const stroke = last >= first ? 'rgba(25,193,201,0.95)' : 'rgba(255,77,109,0.95)'
    const fill = last >= first ? 'rgba(25,193,201,0.16)' : 'rgba(255,77,109,0.16)'
    const fill2 = last >= first ? 'rgba(25,193,201,0.02)' : 'rgba(255,77,109,0.02)'

    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * (width - 2) + 1
        const y = height - 1 - ((v - min) / range) * (height - 2)
        return { x, y }
      })

    const mid = (a: number, b: number) => (a + b) / 2
    const linePath = (() => {
      const d: string[] = []
      d.push(`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`)
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1]
        const p1 = pts[i]
        const cx = mid(p0.x, p1.x)
        const cy = mid(p0.y, p1.y)
        d.push(`Q ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)}`)
      }
      const lastPt = pts[pts.length - 1]
      d.push(`T ${lastPt.x.toFixed(2)} ${lastPt.y.toFixed(2)}`)
      return d.join(' ')
    })()

    const areaPath = (() => {
      const d: string[] = []
      d.push(linePath)
      const lastPt = pts[pts.length - 1]
      const firstPt = pts[0]
      d.push(`L ${lastPt.x.toFixed(2)} ${(height - 1).toFixed(2)}`)
      d.push(`L ${firstPt.x.toFixed(2)} ${(height - 1).toFixed(2)}`)
      d.push('Z')
      return d.join(' ')
    })()

    return (
      <div style={{ ...placeholderStyle, background: 'rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="sparkline">
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fill} />
              <stop offset="100%" stopColor={fill2} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${id}-fill)`} />
          <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  return (
    <div className="grid">
      <div className="col-12">
        <h1 className="title">Mercado</h1>
        <div className="subtitle">Acompanhe preços, variação 24h e livro de ofertas (OKX Market Data).</div>
      </div>

      <div className="col-12">
        {error ? <div className="error">{error}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" disabled={busy} onClick={refreshAll}>
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
        const selected = selectedInstId === t.instId
        const candles = candlesByInstId[t.instId] || []
        return (
          <div
            key={t.instId}
            className="col-6 card"
            style={selected ? { outline: '2px solid rgba(25,193,201,0.55)', outlineOffset: 2 } : undefined}
          >
            <div className="card-inner">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="muted">Instrumento</div>
                  <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>{t.instId}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {buildSparklineSvg(candles, `spark-${t.instId}`)}
                  <div className="pill">USD</div>
                  <button
                    className={selected ? 'btn btn-primary' : 'btn'}
                    disabled={busy}
                    onClick={() => {
                      setSelectedInstId(t.instId)
                      void refreshOrderBook(t.instId)
                    }}
                    type="button"
                  >
                    Livro
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <div>
                  <div className="muted">Preço</div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                    {t.lastUsd.toFixed(4)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="muted">24h</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 900, marginTop: 6, ...changeStyle }}>
                    {changeText}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <div>
                  <div className="muted">Bid/Ask</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 900, marginTop: 6 }}>
                    {fmtUsd(t.bidUsd)} / {fmtUsd(t.askUsd)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="muted">High/Low</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 900, marginTop: 6 }}>
                    {fmtUsd(t.high24hUsd)} / {fmtUsd(t.low24hUsd)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <div className="col-12 card">
        <div className="card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div className="muted">Livro de ofertas</div>
              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>{selectedInstId || '—'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {selectedTicker && stats ? (
                <div className="mono" style={{ fontSize: 14, fontWeight: 900 }}>
                  bid {fmtUsd(stats.bid)} · ask {fmtUsd(stats.ask)} · spread {fmtUsd(stats.spread)}
                </div>
              ) : null}
              <button
                className="btn"
                disabled={busy || !selectedInstId}
                onClick={() => (selectedInstId ? refreshOrderBook(selectedInstId) : undefined)}
                type="button"
              >
                {busy ? 'Atualizando...' : 'Atualizar livro'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 14, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="muted" style={{ marginBottom: 8 }}>
                Asks (venda)
              </div>
              <div className="list">
                {(orderBook?.asks || []).slice(0, 10).map((l, idx) => (
                  <div key={`ask-${idx}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="mono">{l.priceUsd.toFixed(4)}</div>
                    <div className="mono" style={{ color: 'var(--muted)' }}>
                      {l.size.toFixed(6)}
                    </div>
                  </div>
                ))}
                {!orderBook?.asks?.length ? <div className="muted">—</div> : null}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div className="muted" style={{ marginBottom: 8 }}>
                Bids (compra)
              </div>
              <div className="list">
                {(orderBook?.bids || []).slice(0, 10).map((l, idx) => (
                  <div key={`bid-${idx}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="mono">{l.priceUsd.toFixed(4)}</div>
                    <div className="mono" style={{ color: 'var(--muted)' }}>
                      {l.size.toFixed(6)}
                    </div>
                  </div>
                ))}
                {!orderBook?.bids?.length ? <div className="muted">—</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
