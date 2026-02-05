import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api, type AuthResponse } from './api'

type AuthState = {
  accessToken: string | null
  accessExpiresAt: string | null
  refreshToken: string | null
}

type AuthContextValue = AuthState & {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginTestAccount: (id: number) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getValidAccessToken: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function saveTokens(payload: AuthResponse): AuthState {
  const state: AuthState = {
    accessToken: payload.accessToken,
    accessExpiresAt: payload.accessExpiresAt,
    refreshToken: payload.refreshToken,
  }
  localStorage.setItem('trenvus.auth', JSON.stringify(state))
  return state
}

function loadTokens(): AuthState {
  try {
    const raw = localStorage.getItem('trenvus.auth')
    if (!raw) return { accessToken: null, accessExpiresAt: null, refreshToken: null }
    const parsed = JSON.parse(raw) as AuthState
    return {
      accessToken: parsed.accessToken ?? null,
      accessExpiresAt: parsed.accessExpiresAt ?? null,
      refreshToken: parsed.refreshToken ?? null,
    }
  } catch {
    return { accessToken: null, accessExpiresAt: null, refreshToken: null }
  }
}

function clearTokens() {
  localStorage.removeItem('trenvus.auth')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => loadTokens())

  const isAuthenticated = Boolean(state.accessToken && state.refreshToken)

  const setFromResponse = useCallback((payload: AuthResponse) => {
    const next = saveTokens(payload)
    setState(next)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const payload = await api.login(email, password)
    setFromResponse(payload)
  }, [setFromResponse])

  const loginTestAccount = useCallback(async (id: number) => {
    const payload = await api.loginTestAccount(id)
    setFromResponse(payload)
  }, [setFromResponse])

  const register = useCallback(async (email: string, password: string) => {
    const payload = await api.register(email, password)
    setFromResponse(payload)
  }, [setFromResponse])

  const logout = useCallback(async () => {
    const refresh = state.refreshToken
    try {
      if (refresh) await api.logout(refresh)
    } finally {
      clearTokens()
      setState({ accessToken: null, accessExpiresAt: null, refreshToken: null })
    }
  }, [state.refreshToken])

  const getValidAccessToken = useCallback(async () => {
    const access = state.accessToken
    const refresh = state.refreshToken
    if (!access || !refresh) throw new Error('Não autenticado')

    const expiresAt = state.accessExpiresAt ? Date.parse(state.accessExpiresAt) : 0
    const now = Date.now()
    if (expiresAt && now + 10_000 < expiresAt) return access

    const payload = await api.refresh(refresh)
    const next = saveTokens(payload)
    setState(next)
    return next.accessToken as string
  }, [state.accessExpiresAt, state.accessToken, state.refreshToken])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated,
      login,
      loginTestAccount,
      register,
      logout,
      getValidAccessToken,
    }),
    [state, isAuthenticated, login, loginTestAccount, register, logout, getValidAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider ausente')
  return ctx
}
