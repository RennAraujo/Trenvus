import { useEffect, useMemo, useState } from 'react'
import { api, formatUsd, type AdminFeeIncomeResponse, type AdminUserSummary } from '../api'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

export function AdminUsers() {
  const auth = useAuth()
  const { t } = useI18n()

  const [query, setQuery] = useState('')
  const [items, setItems] = useState<AdminUserSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<{ usdCents: number; trvCents: number } | null>(null)
  const [feeIncome, setFeeIncome] = useState<AdminFeeIncomeResponse | null>(null)
  const [walletUsd, setWalletUsd] = useState('0.00')
  const [walletTrv, setWalletTrv] = useState('0.00')
  const [role, setRole] = useState('USER')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedUser = useMemo(() => items.find((u) => u.id === selectedId) || null, [items, selectedId])

  async function loadUsers(q?: string) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.adminListUsers(token, q || undefined, 200)
      setItems(data)
      if (!selectedId && data.length) setSelectedId(data[0]!.id)
    } catch (err: any) {
      setError(err?.message || t('errors.loadUsers'))
    } finally {
      setBusy(false)
    }
  }

  async function loadWallet(userId: number) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.adminGetUserWallet(token, userId)
      setSelectedWallet(data)
      setWalletUsd((data.usdCents / 100).toFixed(2))
      setWalletTrv((data.trvCents / 100).toFixed(2))
    } catch (err: any) {
      setError(err?.message || t('errors.loadWallet'))
      setSelectedWallet(null)
    } finally {
      setBusy(false)
    }
  }

  async function loadFeeIncome(userId: number) {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.adminGetUserFeeIncome(token, userId, 50)
      setFeeIncome(data)
    } catch (err: any) {
      setError(err?.message || t('errors.loadFees'))
      setFeeIncome(null)
    } finally {
      setBusy(false)
    }
  }

  async function saveWallet() {
    if (!selectedId) return
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.adminSetUserWallet(token, selectedId, walletUsd, walletTrv)
      setSelectedWallet(data)
    } catch (err: any) {
      setError(err?.message || t('errors.saveWallet'))
    } finally {
      setBusy(false)
    }
  }

  async function saveRole() {
    if (!selectedId) return
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const updated = await api.adminSetUserRole(token, selectedId, role)
      setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (err: any) {
      setError(err?.message || t('errors.saveRole'))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    setRole(selectedUser.role || 'USER')
    void loadWallet(selectedUser.id)
    void loadFeeIncome(selectedUser.id)
  }, [selectedUser?.id])

  return (
    <div className="grid">
      <div className="col-12">
        <h1 className="title">{t('admin.users.title')}</h1>
        <div className="subtitle">{t('admin.users.subtitle')}</div>
      </div>

      <div className="col-12 card">
        <div className="card-inner">
          {error ? <div className="error">{error}</div> : null}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder')}
              style={{ minWidth: 260, flex: '1 1 260px' as any }}
            />
            <button className="btn" disabled={busy} onClick={() => loadUsers(query)}>
              {t('actions.search')}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
            <div style={{ minWidth: 280, flex: '1 1 320px' as any }}>
              <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                {t('admin.users.list')}
              </div>
              <div className="list" style={{ marginTop: 10, maxHeight: 420, overflow: 'auto' }}>
                {items.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={`btn ${u.id === selectedId ? 'btn-primary' : ''}`}
                    style={{ width: '100%', justifyContent: 'space-between' }}
                    onClick={() => setSelectedId(u.id)}
                  >
                    <span className="mono" style={{ textAlign: 'left' as any }}>
                      {u.email || `#${u.id}`}
                    </span>
                    <span className="pill">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ minWidth: 280, flex: '2 1 420px' as any }}>
              <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                {t('admin.users.details')}
              </div>

              {selectedUser ? (
                <div className="card" style={{ boxShadow: 'none', marginTop: 10 }}>
                  <div className="card-inner" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div className="mono" style={{ fontSize: 12, opacity: 0.85 }}>
                          ID: {selectedUser.id}
                        </div>
                        <div className="mono" style={{ fontSize: 14, marginTop: 6 }}>
                          {selectedUser.email || '—'}
                        </div>
                      </div>
                      <div className="pill">{selectedUser.role}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                      <div style={{ minWidth: 220, flex: '1 1 240px' as any }}>
                        <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                          USD
                        </div>
                        <input className="input" value={walletUsd} onChange={(e) => setWalletUsd(e.target.value)} />
                        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                          {selectedWallet ? `${formatUsd(selectedWallet.usdCents)} USD` : '—'}
                        </div>
                      </div>
                      <div style={{ minWidth: 220, flex: '1 1 240px' as any }}>
                        <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                          TRV
                        </div>
                        <input className="input" value={walletTrv} onChange={(e) => setWalletTrv(e.target.value)} />
                        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                          {selectedWallet ? `${formatUsd(selectedWallet.trvCents)} TRV` : '—'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                      <button className="btn" disabled={busy} onClick={saveWallet}>
                        {t('actions.save')}
                      </button>
                      <button className="btn" disabled={busy} onClick={() => loadWallet(selectedUser.id)}>
                        {t('actions.refresh')}
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 14, paddingTop: 14 }}>
                      <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                        {t('admin.users.role')}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                        <select className="input" value={role} onChange={(e) => setRole(e.target.value)} style={{ minWidth: 220 }}>
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button className="btn" disabled={busy} onClick={saveRole}>
                          {t('actions.apply')}
                        </button>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 14, paddingTop: 14 }}>
                      <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                        {t('admin.users.fees.title')}
                      </div>

                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                        <div className="pill pill-accent">
                          <span className="mono">
                            {t('admin.users.fees.total')}: {feeIncome ? `${formatUsd(feeIncome.totalUsdCents)} USD` : '—'}
                          </span>
                        </div>
                        <button className="btn" disabled={busy} onClick={() => loadFeeIncome(selectedUser.id)}>
                          {t('actions.refresh')}
                        </button>
                      </div>

                      <div className="list" style={{ marginTop: 10 }}>
                        {feeIncome && feeIncome.items.length ? (
                          feeIncome.items.map((it) => (
                            <div key={it.id} className="card" style={{ boxShadow: 'none' }}>
                              <div className="card-inner" style={{ padding: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                  <div className="mono" style={{ fontSize: 12, opacity: 0.82 }}>
                                    {it.tec}
                                  </div>
                                  <div className="mono" style={{ fontSize: 12, opacity: 0.62 }}>
                                    {it.createdAt ? new Date(it.createdAt).toLocaleString() : '—'}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                                  <span className="pill pill-accent">
                                    <span className="mono">
                                      +{formatUsd(it.usdCents)} USD
                                    </span>
                                  </span>
                                  <span className="pill">
                                    <span className="mono">
                                      {t('admin.users.fees.source')}: {it.sourceEmail || (it.sourceUserId ? `#${it.sourceUserId}` : '—')}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="muted">{t('admin.users.fees.empty')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="muted" style={{ marginTop: 10 }}>
                  {t('admin.users.selectUser')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
