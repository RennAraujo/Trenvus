export type AuthResponse = {
  accessToken: string
  accessExpiresAt: string
  refreshToken: string
  tokenType: string
}

export type WalletResponse = {
  usdCents: number
  vpsCents: number
}

export type WalletOperationResponse = WalletResponse & {
  transactionId: number
}

export type ConvertResponse = WalletResponse & {
  transactionId: number
  feeUsdCents: number
}

export type PrivateStatementItem = {
  values: Array<{ currency: string; cents: number }>
}

export type MarketTicker = {
  assetId: string
  priceUsd: number
  change24hPercent: number | null
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || ''

function buildUrl(path: string): string {
  if (!API_BASE_URL) return path
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`
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

  const response = await fetch(buildUrl(path), { ...options, headers })
  if (!response.ok) {
    let message = 'Erro na requisição'
    try {
      const body = await response.json()
      if (body?.message) message = String(body.message)
    } catch {
      message = await response.text().then((t) => t || message)
    }
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  refresh: (refreshToken: string) =>
    request<AuthResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout: (refreshToken: string) =>
    request<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  getWallet: (accessToken: string) => request<WalletResponse>('/wallet', { accessToken }),
  depositUsd: (accessToken: string, amountUsd: string) =>
    request<WalletOperationResponse>('/wallet/deposit', { method: 'POST', accessToken, body: JSON.stringify({ amountUsd }) }),
  convertUsdToVps: (accessToken: string, amountUsd: string, idempotencyKey?: string) =>
    request<ConvertResponse>('/exchange/convert', {
      method: 'POST',
      accessToken,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      body: JSON.stringify({ amountUsd }),
    }),

  getPrivateStatement: (accessToken: string, page: number, size: number) =>
    request<PrivateStatementItem[]>(`/transactions/private?page=${page}&size=${size}`, { accessToken }),

  getMarketTickers: (accessToken: string) => request<MarketTicker[]>('/market/tickers', { accessToken }),
}

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const remainder = abs % 100
  return `${sign}${dollars}.${String(remainder).padStart(2, '0')}`
}

