import { useEffect, useMemo, useState } from 'react'
import { api, formatUsd, type WalletResponse } from '../api'
import { useAuth } from '../auth'

type ConvertDirection = 'USD_TO_VPS' | 'VPS_TO_USD'

export function Dashboard() {
  const auth = useAuth()
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [depositAmount, setDepositAmount] = useState('10.00')
  const [convertDirection, setConvertDirection] = useState<ConvertDirection>('USD_TO_VPS')
  const [convertAmount, setConvertAmount] = useState('10.00')

  const feeCents = 50

  const totals = useMemo(() => {
    const usd = wallet?.usdCents ?? 0
    const vps = wallet?.vpsCents ?? 0
    return { usd, vps }
  }, [wallet])

  async function loadWallet() {
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.getWallet(token)
      setWallet(data)
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar saldo')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadWallet()
  }, [])

  async function onDeposit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const data = await api.depositUsd(token, depositAmount)
      setWallet({ usdCents: data.usdCents, vpsCents: data.vpsCents })
      setDepositAmount('')
    } catch (err: any) {
      setError(err?.message || 'Falha ao depositar')
    } finally {
      setBusy(false)
    }
  }

  async function onConvert(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const token = await auth.getValidAccessToken()
      const idempotencyKey = crypto.randomUUID()
      const data =
        convertDirection === 'USD_TO_VPS'
          ? await api.convertUsdToVps(token, convertAmount, idempotencyKey)
          : await api.convertVpsToUsd(token, convertAmount, idempotencyKey)
      setWallet({ usdCents: data.usdCents, vpsCents: data.vpsCents })
      setConvertAmount('')
    } catch (err: any) {
      setError(err?.message || 'Falha ao converter')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid">
      <div className="col-12">
        <h1 className="title">Dashboard</h1>
        <div className="subtitle">Saldo, depósito e conversão USD ↔ VPS (1:1).</div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div className="muted">Saldo USD</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
                {formatUsd(totals.usd)} USD
              </div>
            </div>
            <div className="pill pill-accent">Disponível</div>
          </div>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div className="muted">Saldo VPS</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
                {formatUsd(totals.vps)} VPS
              </div>
            </div>
            <div className="pill">1 VPS = 1 USD</div>
          </div>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <h3 style={{ margin: 0 }}>Depositar USD</h3>
          <div className="muted" style={{ marginTop: 6 }}>
            Simulação de depósito (MVP). Informe um valor com 2 casas decimais.
          </div>
          <form className="list" onSubmit={onDeposit} style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">Valor (USD)</div>
              <input className="input mono" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={busy} type="submit">
              Depositar
            </button>
          </form>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0 }}>Converter</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={convertDirection === 'USD_TO_VPS' ? 'btn btn-primary' : 'btn'}
                disabled={busy}
                type="button"
                onClick={() => setConvertDirection('USD_TO_VPS')}
              >
                USD → VPS
              </button>
              <button
                className={convertDirection === 'VPS_TO_USD' ? 'btn btn-primary' : 'btn'}
                disabled={busy}
                type="button"
                onClick={() => setConvertDirection('VPS_TO_USD')}
              >
                VPS → USD
              </button>
            </div>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            Câmbio 1:1. Taxa fixa: <span className="mono">{formatUsd(feeCents)} USD</span> por transação.
          </div>
          <form className="list" onSubmit={onConvert} style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">Valor ({convertDirection === 'USD_TO_VPS' ? 'USD' : 'VPS'})</div>
              <input className="input mono" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={busy} type="submit">
              Converter
            </button>
          </form>
        </div>
      </div>

      <div className="col-12">
        {error ? <div className="error">{error}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" disabled={busy} onClick={loadWallet}>
            {busy ? 'Atualizando...' : 'Atualizar saldo'}
          </button>
        </div>
      </div>
    </div>
  )
}
