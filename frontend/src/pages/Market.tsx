import { useEffect, useMemo, useRef, useState } from 'react'
import { api, type CandlePoint, type MarketTicker, type OrderBook } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

const MARKET_INSTRUMENTS = ['BTC-USDT', 'ETH-USDT', 'XRP-USDT', 'USDT-BRL'] as const

type CoinextL2Row = any[]

export function Market() {
  const auth = useAuth()
  const { t } = useI18n()
  const [tickers, setTickers] = useState<MarketTicker[]>([])
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null)
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [candlesByInstId, setCandlesByInstId] = useState<Record<string, CandlePoint[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refreshInFlightRef = useRef(false)
  const selectedInstIdRef = useRef<string | null>(null)
  const refreshIntervalMs = 10_000

  function isCoinextInstId(instId: string): boolean {
    return instId === 'USDT-BRL' || instId === 'USDT/BRL'
  }

  function normalizeInstId(instId: string): string {
    return instId.trim().toUpperCase().replace('/', '-')
  }

  function mapCoinextInstrumentId(instId: string): number | null {
    const normalized = normalizeInstId(instId)
    if (normalized === 'USDT-BRL') return 10
    return null
  }

  async function fetchCoinextL2Snapshot(instId: string, depth: number): Promise<CoinextL2Row[]> {
    const instrumentId = mapCoinextInstrumentId(instId)
    if (!instrumentId) return []
    const safeDepth = Math.max(1, Math.min(50, depth))

    try {
      const res = await fetch('/coinext/AP/GetL2Snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ OMSId: 1, InstrumentId: instrumentId, Depth: safeDepth }),
      })
      if (!res.ok) return []
      const data = await res.json()
      if (!Array.isArray(data)) return []
      return data as CoinextL2Row[]
    } catch {
      return []
    }
  }

  function parseCoinextTicker(instId: string, rows: CoinextL2Row[]): MarketTicker | null {
    let last: number | null = null
    let bestBid: number | null = null
    let bestAsk: number | null = null
    let ts: string | null = null

    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 10) continue
      const lastTradePrice = Number(row[4])
      const price = Number(row[6])
      const qty = Number(row[8])
      const side = Number(row[9])
      const actionTs = row[2] != null ? String(row[2]) : null

      if (ts === null && actionTs) ts = actionTs
      if (last === null && Number.isFinite(lastTradePrice)) last = lastTradePrice
      if (!Number.isFinite(price) || !Number.isFinite(qty) || !Number.isFinite(side)) continue
      if (side === 0) {
        if (bestBid === null || price > bestBid) bestBid = price
      } else if (side === 1) {
        if (bestAsk === null || price < bestAsk) bestAsk = price
      }
    }

    if (last === null) return null
    return {
      instId: normalizeInstId(instId),
      baseCurrency: 'USDT',
      quoteCurrency: 'BRL',
      last,
      bid: bestBid,
      ask: bestAsk,
      change24hPercent: null,
      high24h: null,
      low24h: null,
      vol24hBase: null,
      vol24hQuote: null,
      ts,
    }
  }

  function parseCoinextOrderBook(instId: string, rows: CoinextL2Row[], depth = 10): OrderBook {
    const asks: { price: number; size: number }[] = []
    const bids: { price: number; size: number }[] = []
    let ts: string | null = null

    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 10) continue
      const price = Number(row[6])
      const qty = Number(row[8])
      const side = Number(row[9])
      const actionTs = row[2] != null ? String(row[2]) : null
      if (ts === null && actionTs) ts = actionTs
      if (!Number.isFinite(price) || !Number.isFinite(qty) || !Number.isFinite(side)) continue
      if (side === 0) bids.push({ price, size: qty })
      if (side === 1) asks.push({ price, size: qty })
    }

    asks.sort((a, b) => a.price - b.price)
    bids.sort((a, b) => b.price - a.price)
    return {
      instId: normalizeInstId(instId),
      baseCurrency: 'USDT',
      quoteCurrency: 'BRL',
      asks: asks.slice(0, depth),
      bids: bids.slice(0, depth),
      ts,
    }
  }

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
      let nextTickers = data

      const coinextRows = await fetchCoinextL2Snapshot('USDT-BRL', 10)
      const coinextTicker = parseCoinextTicker('USDT-BRL', coinextRows)
      if (coinextTicker) {
        nextTickers = [...nextTickers.filter((t) => normalizeInstId(t.instId) !== 'USDT-BRL'), coinextTicker]
      }
      setTickers(nextTickers)

      const candleResults = await Promise.allSettled(
        data
          .filter((t) => !isCoinextInstId(t.instId))
          .map(async (t) => ({ instId: t.instId, candles: await api.getMarketCandles(token, t.instId, '1H', 24) })),
      )
      setCandlesByInstId((prev) => {
        const next = { ...prev }
        for (const r of candleResults) {
          if (r.status === 'fulfilled') {
            next[r.value.instId] = r.value.candles
          }
        }
        if (coinextTicker && coinextTicker.last != null) {
          const key = 'USDT-BRL'
          const prevSeries = next[key] || []
          const nowTs = String(Date.now())
          const series = [...prevSeries, { ts: nowTs, close: coinextTicker.last }]
          next[key] = series.slice(-60)
        }
        return next
      })

      let instId = selectedInstIdRef.current
      if (!instId && nextTickers.length > 0) {
        instId = nextTickers[0].instId
        setSelectedInstId(instId)
      }

      if (instId) {
        if (isCoinextInstId(instId)) {
          const rows = coinextRows.length ? coinextRows : await fetchCoinextL2Snapshot(instId, 10)
          setOrderBook(parseCoinextOrderBook(instId, rows, 10))
        } else {
          const ob = await api.getMarketOrderBook(token, instId, 10)
          setOrderBook(ob)
        }
      }
    } catch (err: any) {
      setError(err?.message || t('errors.loadMarket'))
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
      if (isCoinextInstId(instId)) {
        const rows = await fetchCoinextL2Snapshot(instId, 10)
        setOrderBook(parseCoinextOrderBook(instId, rows, 10))
      } else {
        const token = await auth.getValidAccessToken()
        const data = await api.getMarketOrderBook(token, instId, 10)
        setOrderBook(data)
      }
    } catch (err: any) {
      setError(err?.message || t('errors.loadOrderBook'))
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
    const bid = t.bid ?? null
    const ask = t.ask ?? null
    const spread = bid !== null && ask !== null ? ask - bid : null
    return { bid, ask, spread }
  }, [selectedTicker])

  function fmtPrice(v: number | null, decimals = 4): string {
    if (v === null) return '—'
    return v.toFixed(decimals)
  }

  function displayInstrument(instId: string): string {
    return instId === 'USDT-BRL' ? 'USDT/BRL' : instId
  }

  function quoteCurrency(instId: string): string {
    const normalized = instId.toUpperCase().replace('/', '-')
    const parts = normalized.split('-')
    return parts.length >= 2 ? parts[1] : '—'
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

    const values = points.map((p) => p.close)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min

    const first = values[0]
    const last = values[values.length - 1]
    const stroke = last >= first ? 'rgba(25,193,201,0.95)' : 'rgba(255,77,109,0.95)'
    const fill = last >= first ? 'rgba(25,193,201,0.16)' : 'rgba(255,77,109,0.16)'
    const fill2 = last >= first ? 'rgba(25,193,201,0.02)' : 'rgba(255,77,109,0.02)'

    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * (width - 2) + 1
        const y =
          range === 0 ? height / 2 : height - 1 - ((v - min) / range) * (height - 2)
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
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={t('labels.sparklineAria')}>
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
        <h1 className="title">{t('market.title')}</h1>
        <div className="subtitle">{t('market.subtitle')}</div>
      </div>

      <div className="col-12">
        {error ? <div className="error">{error}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" disabled={busy} onClick={refreshAll}>
            {busy ? t('actions.updating') : t('actions.update')}
          </button>
        </div>
      </div>

      {MARKET_INSTRUMENTS.map((instId) => {
        const ticker = tickers.find((t) => t.instId === instId) || null
        const candles = candlesByInstId[instId] || []
        const candleMin = candles.length ? Math.min(...candles.map((c) => c.close)) : null
        const candleMax = candles.length ? Math.max(...candles.map((c) => c.close)) : null
        const candleChange =
          candles.length >= 2 && candles[0].close !== 0
            ? ((candles[candles.length - 1].close - candles[0].close) / candles[0].close) * 100
            : null

        const change = ticker?.change24hPercent ?? candleChange
        const changeText = change === null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
        const changeStyle =
          change === null
            ? { color: 'var(--muted)' }
            : change >= 0
              ? { color: 'rgba(25,193,201,0.95)' }
              : { color: 'rgba(255,77,109,0.95)' }
        const selected = selectedInstId === instId
        const isMissing = ticker === null
        const lastFromCandles = candles.length ? candles[candles.length - 1].close : null
        return (
          <div
            key={instId}
            className="col-6 card"
            style={selected ? { outline: '2px solid rgba(25,193,201,0.55)', outlineOffset: 2 } : undefined}
          >
            <div className="card-inner">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="muted">{t('labels.instrument')}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>{displayInstrument(instId)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {buildSparklineSvg(candles, `spark-${instId}`)}
                  <div className="pill">{ticker?.quoteCurrency || quoteCurrency(instId)}</div>
                  <button
                    className={selected ? 'btn btn-primary' : 'btn'}
                    disabled={busy || isMissing}
                    onClick={() => {
                      setSelectedInstId(instId)
                      void refreshOrderBook(instId)
                    }}
                    type="button"
                  >
                    {t('actions.orderBook')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <div>
                  <div className="muted">{t('labels.price')}</div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                    {ticker ? ticker.last.toFixed(4) : fmtPrice(lastFromCandles)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="muted">{t('labels.change24h')}</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 900, marginTop: 6, ...changeStyle }}>
                    {changeText}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <div>
                  <div className="muted">{t('labels.bidAsk')}</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 900, marginTop: 6 }}>
                    {fmtPrice(ticker?.bid ?? null)} / {fmtPrice(ticker?.ask ?? null)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="muted">{t('labels.highLow')}</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 900, marginTop: 6 }}>
                    {fmtPrice(ticker?.high24h ?? candleMax)} / {fmtPrice(ticker?.low24h ?? candleMin)}
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
              <div className="muted">{t('labels.orderBookTitle')}</div>
              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>
                {selectedInstId ? displayInstrument(selectedInstId) : '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {selectedTicker && stats ? (
                <div className="mono" style={{ fontSize: 14, fontWeight: 900 }}>
                  {t('labels.bidAsk')}: {fmtPrice(stats.bid)} / {fmtPrice(stats.ask)} · {t('labels.spread')}: {fmtPrice(stats.spread)}
                </div>
              ) : null}
              <button
                className="btn"
                disabled={busy || !selectedInstId}
                onClick={() => (selectedInstId ? refreshOrderBook(selectedInstId) : undefined)}
                type="button"
              >
                {busy ? t('actions.updating') : t('actions.updateOrderBook')}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 14, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="muted" style={{ marginBottom: 8 }}>
                {t('labels.asks')}
              </div>
              <div className="list">
                {(orderBook?.asks || []).slice(0, 10).map((l, idx) => (
                  <div key={`ask-${idx}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="mono">{l.price.toFixed(4)}</div>
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
                {t('labels.bids')}
              </div>
              <div className="list">
                {(orderBook?.bids || []).slice(0, 10).map((l, idx) => (
                  <div key={`bid-${idx}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="mono">{l.price.toFixed(4)}</div>
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
