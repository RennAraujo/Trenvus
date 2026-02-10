import { useState } from 'react'
import { useI18n } from '../i18n'

type DemoInvoice = {
  fromEmail: string
  currency: string
  amount: string
  dueDate: string
}

export function InvoicesReceive() {
  const { t } = useI18n()
  const [demo, setDemo] = useState<DemoInvoice | null>(null)

  return (
    <div className="grid">
      <div className="col-12">
        <h1 className="title">{t('invoices.receive.title')}</h1>
        <div className="subtitle">{t('invoices.receive.subtitle')}</div>
      </div>

      <div className="col-12 card">
        <div className="card-inner">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
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

