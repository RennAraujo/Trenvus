import { useEffect, useMemo, useRef, useState } from 'react'
import { api, type CandlePoint, type MarketTicker, type OrderBook } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

// Icons
const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
)

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
)

const CryptoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.5 9.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2.5 1.5"/><path d="M9.5 14.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5"/><line x1="12" x2="12" y1="8" y2="16"/>
  </svg>
)

const FiatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const DEFAULT_CRYPTO_PAIRS = ['BTC-USDT', 'ETH-USDT', 'XRP-USDT', 'SOL-USDT', 'ADA-USDT', 'USDT-BRL']
const DEFAULT_FIAT_PAIRS = ['USD-EUR', 'USD-GBP', 'USD-JPY', 'USD-CNY', 'USD-CHF', 'USD-BRL']

// Keep for future use when implementing pair filtering
void DEFAULT_CRYPTO_PAIRS
void DEFAULT_FIAT_PAIRS

export function Market() {
  const auth = useAuth()
  const { t } = useI18n()
  const [cryptoTickers, setCryptoTickers] = useState<MarketTicker[]>([])
  const [fiatTickers, setFiatTickers] = useState<MarketTicker[]>([])
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'crypto' | 'fiat'>('crypto')
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

  function isCoinextInstId(instId: string): boolean {
    return instId === 'USDT-BRL' || instId === 'USDT/BRL'
  }

  function normalizeInstId(instId: string): string {
    return instId.trim().toUpperCase().replace('/', '-')
  }

  // Keep for future use
  void normalizeInstId

  async function refreshAll() {
    if (refreshInFlightRef.current) return
    refreshInFlightRef.current = true
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      
      // Fetch both crypto and fiat tickers in parallel
      const [cryptoData, fiatData] = await Promise.all([
        api.getCryptoTickers(token),
        api.getFiatTickers(token)
      ])
      
      setCryptoTickers(cryptoData)
      setFiatTickers(fiatData)

      // Fetch candles for crypto only (fiat uses synthetic rates)
      const candleResults = await Promise.allSettled(
        cryptoData
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
        return next
      })

      // Auto-select first ticker if none selected
      const allTickers = [...cryptoData, ...fiatData]
      let instId = selectedInstIdRef.current
      if (!instId && allTickers.length > 0) {
        instId = allTickers[0].instId
        setSelectedInstId(instId)
        setSelectedCategory('crypto')
      }

      if (instId) {
        if (isCoinextInstId(instId)) {
          // For USDT-BRL, we don't have order book via API
          setOrderBook(null)
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
        setOrderBook(null)
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
    const allTickers = [...cryptoTickers, ...fiatTickers]
    return allTickers.find((t) => t.instId === selectedInstId) || null
  }, [selectedInstId, cryptoTickers, fiatTickers])

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
    return instId === 'USDT-BRL' ? 'USDT/BRL' : instId.replace('-', '/')
  }

  function quoteCurrency(instId: string): string {
    const normalized = instId.toUpperCase().replace('/', '-')
    const parts = normalized.split('-')
    return parts.length >= 2 ? parts[1] : '—'
  }

  function getCategoryIcon(category: 'crypto' | 'fiat') {
    return category === 'crypto' ? <CryptoIcon /> : <FiatIcon />
  }

  // Keep for future use
  void getCategoryIcon

  function getCategoryLabel(category: 'crypto' | 'fiat') {
    return category === 'crypto' ? t('market.crypto') || 'Cryptocurrencies' : t('market.fiat') || 'Fiat Currencies'
  }

  function buildSparklineSvg(points: CandlePoint[], width = 100, height = 36): React.ReactNode {
    if (!points || points.length < 2) {
      return (
        <div style={{ width, height, borderRadius: 6, background: 'var(--bg-subtle)' }} />
      )
    }

    const values = points.map((p) => p.close)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min

    const first = values[0]
    const last = values[values.length - 1]
    const stroke = last >= first ? 'var(--color-success)' : 'var(--color-danger)'
    const fill = last >= first ? 'var(--color-success-alpha-10)' : 'var(--color-danger-alpha-10)'

    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 2) + 1
      const y = range === 0 ? height / 2 : height - 1 - ((v - min) / range) * (height - 2)
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
      <div style={{ width, height, borderRadius: 6, overflow: 'hidden' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <path d={areaPath} fill={fill} />
          <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  function renderTickerCard(ticker: MarketTicker, isCrypto: boolean) {
    const instId = ticker.instId
    const candles = candlesByInstId[instId] || []
    const candleMin = candles.length ? Math.min(...candles.map((c) => c.close)) : null
    const candleMax = candles.length ? Math.max(...candles.map((c) => c.close)) : null
    const candleChange =
      candles.length >= 2 && candles[0].close !== 0
        ? ((candles[candles.length - 1].close - candles[0].close) / candles[0].close) * 100
        : null

    const change = ticker.change24hPercent ?? candleChange
    const changeText = change === null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
    const isPositive = change === null ? null : change >= 0
    const selected = selectedInstId === instId

    return (
      <div
        key={instId}
        className={`card ${selected ? 'card-interactive' : ''}`}
        onClick={() => {
          setSelectedInstId(instId)
          setSelectedCategory(isCrypto ? 'crypto' : 'fiat')
          void refreshOrderBook(instId)
        }}
        style={{ 
          cursor: 'pointer',
          borderColor: selected ? 'var(--color-primary)' : undefined,
          boxShadow: selected ? 'var(--shadow-glow-sm)' : undefined
        }}
      >
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{displayInstrument(instId)}</h3>
                <span className="badge badge-primary">{quoteCurrency(instId)}</span>
              </div>
              <div className="font-mono" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {ticker.last.toFixed(isCrypto ? 4 : 2)}
              </div>
            </div>
            {isCrypto ? buildSparklineSvg(candles) : null}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
            <div>
              <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05 }}>24h Change</div>
              <div 
                className="font-mono font-semibold" 
                style={{ 
                  fontSize: 16, 
                  marginTop: 4,
                  color: isPositive === null ? 'var(--text-muted)' : isPositive ? 'var(--color-success)' : 'var(--color-danger)'
                }}
              >
                {changeText}
              </div>
            </div>
            <div>
              <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05 }}>Bid / Ask</div>
              <div className="font-mono font-semibold" style={{ fontSize: 14, marginTop: 4, color: 'var(--text-secondary)' }}>
                {fmtPrice(ticker.bid ?? null)} / {fmtPrice(ticker.ask ?? null)}
              </div>
            </div>            {isCrypto && (
              <div>
                <div className="text-xs text-tertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.05 }}>High / Low</div>
                <div className="font-mono font-semibold" style={{ fontSize: 14, marginTop: 4, color: 'var(--text-secondary)' }}>
                  {fmtPrice(ticker.high24h ?? candleMax)} / {fmtPrice(ticker.low24h ?? candleMin)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">{t('market.title')}</h1>
            <p className="page-subtitle">{t('market.subtitle')}</p>
          </div>
          <button 
            className="btn btn-secondary btn-icon" 
            disabled={busy} 
            onClick={refreshAll}
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          className={`btn ${selectedCategory === 'crypto' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCategory('crypto')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <CryptoIcon />
          {getCategoryLabel('crypto')}
        </button>
        <button
          className={`btn ${selectedCategory === 'fiat' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCategory('fiat')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FiatIcon />
          {getCategoryLabel('fiat')}
        </button>
      </div>

      {/* Market Cards */}
      <div className="grid grid-cols-2 md:grid-cols-1" style={{ gap: 20, marginBottom: 32 }}>
        {selectedCategory === 'crypto' && cryptoTickers.map((t) => renderTickerCard(t, true))}
        {selectedCategory === 'fiat' && fiatTickers.map((t) => renderTickerCard(t, false))}
      </div>

      {/* Order Book */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookIcon />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Order Book</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {selectedInstId ? displayInstrument(selectedInstId) : 'Select a market'}
              </p>
            </div>
          </div>
          
          {selectedTicker && stats && (
            <div className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
              Spread: {fmtPrice(stats.spread, 6)}
            </div>
          )}
        </div>

        <div className="card-body">
          {!selectedInstId ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <TrendingUpIcon />
              </div>
              <h3 className="empty-state-title">Select a market</h3>
              <p className="empty-state-desc">Click on any market card above to view its order book.</p>
            </div>
          ) : selectedCategory === 'fiat' ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FiatIcon />
              </div>
              <h3 className="empty-state-title">Fiat Currency</h3>
              <p className="empty-state-desc">Order book is not available for fiat currency pairs. Rates are indicative only.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {/* Asks */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  background: 'var(--bg-subtle)',
                  borderRadius: 8,
                  marginBottom: 12
                }}>
                  <span className="text-xs font-semibold text-tertiary">PRICE</span>
                  <span className="text-xs font-semibold text-tertiary">SIZE</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(orderBook?.asks || []).slice(0, 10).map((l, idx) => (
                    <div 
                      key={`ask-${idx}`} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '8px 16px',
                        borderRadius: 6,
                        background: 'rgba(239, 68, 68, 0.05)'
                      }}
                    >
                      <span className="font-mono text-sm" style={{ color: 'var(--color-danger)' }}>{l.price.toFixed(4)}</span>
                      <span className="font-mono text-sm text-secondary">{l.size.toFixed(6)}</span>
                    </div>
                  ))}
                  {!orderBook?.asks?.length && (
                    <div className="text-center text-muted" style={{ padding: 40 }}>No asks available</div>
                  )}
                </div>
              </div>

              {/* Bids */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  background: 'var(--bg-subtle)',
                  borderRadius: 8,
                  marginBottom: 12
                }}>
                  <span className="text-xs font-semibold text-tertiary">PRICE</span>
                  <span className="text-xs font-semibold text-tertiary">SIZE</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(orderBook?.bids || []).slice(0, 10).map((l, idx) => (
                    <div 
                      key={`bid-${idx}`} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '8px 16px',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.05)'
                      }}
                    >
                      <span className="font-mono text-sm" style={{ color: 'var(--color-success)' }}>{l.price.toFixed(4)}</span>
                      <span className="font-mono text-sm text-secondary">{l.size.toFixed(6)}</span>
                    </div>
                  ))}
                  {!orderBook?.bids?.length && (
                    <div className="text-center text-muted" style={{ padding: 40 }}>No bids available</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedInstId && selectedCategory === 'crypto' && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={busy || !selectedInstId}
              onClick={() => selectedInstId && refreshOrderBook(selectedInstId)}
            >
              <RefreshIcon />
              {busy ? 'Updating...' : 'Refresh Order Book'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
