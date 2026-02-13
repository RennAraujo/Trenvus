import { useMemo, useState } from 'react'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'

type DemoInvoice = {
  fromEmail: string
  currency: string
  amount: string
  dueDate: string
}

function demoQrBackground(seed: string): string {
  let x = 0
  for (let i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) >>> 0
  const a = 30 + (x % 70)
  const b = 30 + ((x >>> 8) % 70)
  const c = 30 + ((x >>> 16) % 70)
  return `repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0, rgba(255,255,255,0.10) ${a}px, rgba(255,255,255,0.00) ${a}px, rgba(255,255,255,0.00) ${a + 10}px),
repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0, rgba(255,255,255,0.10) ${b}px, rgba(255,255,255,0.00) ${b}px, rgba(255,255,255,0.00) ${b + 12}px),
radial-gradient(circle at 20% 20%, rgba(25,193,201,0.20), transparent ${c}%)`
}

export function InvoicesReceive() {
  const auth = useAuth()
  const { t } = useI18n()
  const [demo, setDemo] = useState<DemoInvoice | null>(null)
  const [amount, setAmount] = useState('15.00')
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })
  const [showQr, setShowQr] = useState(false)

  const payload = useMemo(() => {
    return {
      type: 'INVOICE',
      toEmail: auth.userEmail || null,
      currency: 'USD',
      amount,
      dueDate,
    }
  }, [amount, auth.userEmail, dueDate])

  const bg = useMemo(() => demoQrBackground(JSON.stringify(payload)), [payload])

  return (
    <div className="grid">
      <div className="col-12">
        <h1 className="title">{t('invoices.receive.title')}</h1>
        <div className="subtitle">{t('invoices.receive.subtitle')}</div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <h3 style={{ margin: 0 }}>{t('invoices.receive.chargeTitle')}</h3>
          <div className="muted" style={{ marginTop: 6 }}>
            {t('invoices.receive.chargeSubtitle')}
          </div>
          <form className="list" style={{ marginTop: 12 }} onSubmit={(e) => e.preventDefault()}>
            <div className="field">
              <div className="label">{t('invoices.receive.amount')}</div>
              <input className="input mono" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </div>
            <div className="field">
              <div className="label">{t('invoices.receive.dueDate')}</div>
              <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as any }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setShowQr(true)}
                disabled={!amount.trim() || !dueDate.trim()}
              >
                {t('invoices.receive.generateDemo')}
              </button>
              {showQr ? (
                <button className="btn" type="button" onClick={() => setShowQr(false)}>
                  {t('actions.hide')}
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div className="col-6 card">
        <div className="card-inner">
          <h3 style={{ margin: 0 }}>{t('invoices.receive.qrTitle')}</h3>
          <div className="muted" style={{ marginTop: 6 }}>
            {t('invoices.receive.qrSubtitle')}
          </div>

          {showQr ? (
            <div style={{ marginTop: 12, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div
                className="card"
                style={{
                  width: 260,
                  height: 260,
                  borderRadius: 18,
                  boxShadow: 'none',
                  overflow: 'hidden',
                  background: bg,
                }}
              />
              <div style={{ flex: '1 1 220px' as any, minWidth: 220 }}>
                <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                  {t('invoices.receive.payload')}
                </div>
                <pre
                  className="mono"
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    padding: 12,
                    borderRadius: 14,
                    overflow: 'auto',
                    maxHeight: 260,
                  }}
                >
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 12 }}>
              {t('invoices.receive.qrEmpty')}
            </div>
          )}
        </div>
      </div>

      <div className="col-12 card">
        <div className="card-inner">
          <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
            {t('invoices.receive.scanTitle')}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() =>
                setDemo({
                  fromEmail: 'user2@test.com',
                  currency: 'USD',
                  amount: '15.00',
                  dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10),
                })
              }
            >
              {t('invoices.receive.simulateScan')}
            </button>
            {demo ? (
              <button className="btn" type="button" onClick={() => setDemo(null)}>
                {t('actions.clear')}
              </button>
            ) : null}
          </div>

          <div style={{ marginTop: 14 }}>
            {demo ? (
              <div className="card" style={{ boxShadow: 'none' }}>
                <div className="card-inner" style={{ padding: 14 }}>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                    {t('invoices.receive.detected')}
                  </div>
                  <div className="list" style={{ marginTop: 10 }}>
                    <div>
                      <div className="muted">{t('invoices.receive.from')}</div>
                      <div className="mono" style={{ marginTop: 4 }}>
                        {demo.fromEmail}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
                      <div style={{ minWidth: 220, flex: '1 1 240px' as any }}>
                        <div className="muted">{t('invoices.receive.amount')}</div>
                        <div className="mono" style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>
                          {demo.amount} {demo.currency}
                        </div>
                      </div>
                      <div style={{ minWidth: 220, flex: '1 1 240px' as any }}>
                        <div className="muted">{t('invoices.receive.dueDate')}</div>
                        <div className="mono" style={{ fontSize: 16, marginTop: 10 }}>
                          {demo.dueDate}
                        </div>
                      </div>
                    </div>
                    <div className="muted" style={{ marginTop: 10 }}>
                      {t('invoices.receive.futureNote')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="muted">{t('invoices.receive.empty')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
