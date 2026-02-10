export type AuthResponse = {
  accessToken: string
  accessExpiresAt: string
  refreshToken: string
  tokenType: string
}

export type WalletResponse = {
  usdCents: number
  trvCents: number
}

export type WalletOperationResponse = WalletResponse & {
  transactionId: number
}

export type ConvertResponse = WalletResponse & {
  transactionId: number
  feeUsdCents: number
}

export type TransferResponse = WalletResponse & {
  transactionId: number
  feeTrvCents: number
}

export type PrivateStatementItem = {
  id: number
  tec: string
  type: string
  createdAt: string | null
  values: Array<{ currency: string; cents: number; fee: boolean }>
}

export type MarketTicker = {
  instId: string
  baseCurrency: string | null
  quoteCurrency: string | null
  last: number
  bid: number | null
  ask: number | null
  change24hPercent: number | null
  high24h: number | null
  low24h: number | null
  vol24hBase: number | null
  vol24hQuote: number | null
  ts: string | null
}

export type OrderBook = {
  instId: string
  baseCurrency: string | null
  quoteCurrency: string | null
  asks: Array<{ price: number; size: number }>
  bids: Array<{ price: number; size: number }>
  ts: string | null
}

export type CandlePoint = {
  ts: string
  close: number
}

export class ApiError extends Error {
  readonly status: number
  readonly url: string
  readonly body: string

  constructor(params: { message: string; status: number; url: string; body: string }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.url = params.url
    this.body = params.body
  }
}

export class NetworkError extends Error {
  readonly url: string
  readonly cause?: unknown

  constructor(params: { message: string; url: string; cause?: unknown }) {
    super(params.message)
    this.name = 'NetworkError'
    this.url = params.url
    this.cause = params.cause
  }
}

export class ResponseParseError extends Error {
  readonly url: string
  readonly body: string

  constructor(params: { message: string; url: string; body: string }) {
    super(params.message)
    this.name = 'ResponseParseError'
    this.url = params.url
    this.body = params.body
  }
}

const ENV = ((import.meta as any).env || {}) as { VITE_API_BASE_URL?: string }
const API_BASE_URL = ENV.VITE_API_BASE_URL || '/api'

function buildUrl(path: string): string {
  if (!API_BASE_URL) return path
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0')
}

export function createIdempotencyKey(): string {
  const cryptoApi = (globalThis as any)?.crypto as Crypto | undefined

  if (cryptoApi && typeof (cryptoApi as any).randomUUID === 'function') {
    return (cryptoApi as any).randomUUID() as string
  }

  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    cryptoApi.getRandomValues(bytes)

    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const b = Array.from(bytes)
    return [
      b.slice(0, 4).map(toHex).join(''),
      b.slice(4, 6).map(toHex).join(''),
      b.slice(6, 8).map(toHex).join(''),
      b.slice(8, 10).map(toHex).join(''),
      b.slice(10, 16).map(toHex).join(''),
    ].join('-')
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
}

async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`)
  }

  const url = buildUrl(path)
  const method = (options.method || 'GET').toUpperCase()
  const isAuthCall = path.startsWith('/auth/')
  const maxAttempts = isAuthCall && method === 'POST' ? 5 : 1

  let response: Response | null = null
  let lastFetchError: unknown = null
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lastFetchError = null
    try {
      response = await fetch(url, { ...options, headers })
    } catch (cause) {
      lastFetchError = cause
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 600))
        continue
      }
      throw new NetworkError({ message: 'Falha de rede ao acessar a API', url, cause })
    }

    if (response.status === 502 || response.status === 503 || response.status === 504) {
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 600))
        continue
      }
    }

    break
  }

  if (!response) {
    throw new NetworkError({ message: 'Falha de rede ao acessar a API', url, cause: lastFetchError })
  }
  if (!response.ok) {
    let message = 'Erro na requisição'
    const raw = await response.text().catch(() => '')
    if (raw) {
      try {
        const body = JSON.parse(raw)
        if (body?.message) message = String(body.message)
        else message = raw
      } catch {
        message = raw
      }
    }
    throw new ApiError({ message, status: response.status, url, body: raw })
  }

  if (response.status === 204) return undefined as T
  const raw = await response.text().catch(() => '')
  if (!raw) return undefined as T
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new ResponseParseError({ message: 'Resposta inválida da API', url, body: raw })
  }
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  loginTestAccount: (id: number) =>
    request<AuthResponse>('/auth/test-login', { method: 'POST', body: JSON.stringify({ id }) }),
  refresh: (refreshToken: string) =>
    request<AuthResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout: (refreshToken: string) =>
    request<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  getWallet: (accessToken: string) => request<WalletResponse>('/wallet', { accessToken }),
  depositUsd: (accessToken: string, amountUsd: string) =>
    request<WalletOperationResponse>('/wallet/deposit', { method: 'POST', accessToken, body: JSON.stringify({ amountUsd }) }),
  convertUsdToTrv: (accessToken: string, amountUsd: string, idempotencyKey?: string) =>
    request<ConvertResponse>('/exchange/convert', {
      method: 'POST',
      accessToken,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      body: JSON.stringify({ amountUsd }),
    }),
  convertTrvToUsd: (accessToken: string, amountTrv: string, idempotencyKey?: string) =>
    request<ConvertResponse>('/exchange/convert-trv-to-usd', {
      method: 'POST',
      accessToken,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      body: JSON.stringify({ amountTrv }),
    }),

  transferTrv: (accessToken: string, toEmail: string, amountTrv: string) =>
    request<TransferResponse>('/transfer/trv', { method: 'POST', accessToken, body: JSON.stringify({ toEmail, amountTrv }) }),

  getPrivateStatement: (accessToken: string, page: number, size: number) =>
    request<PrivateStatementItem[]>(`/transactions/private?page=${page}&size=${size}`, { accessToken }),

  getMarketTickers: (accessToken: string) => request<MarketTicker[]>('/market/tickers', { accessToken }),
  getMarketOrderBook: (accessToken: string, instId: string, size = 10) =>
    request<OrderBook>(`/market/orderbook?instId=${encodeURIComponent(instId)}&size=${size}`, { accessToken }),
  getMarketCandles: (accessToken: string, instId: string, bar = '1H', limit = 24) =>
    request<CandlePoint[]>(
      `/market/candles?instId=${encodeURIComponent(instId)}&bar=${encodeURIComponent(bar)}&limit=${limit}`,
      { accessToken },
    ),
}

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const remainder = abs % 100
  const grouped = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}${grouped}.${String(remainder).padStart(2, '0')}`
}
