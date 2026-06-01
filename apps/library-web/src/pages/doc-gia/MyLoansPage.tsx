import { useEffect, useState } from 'react'
import {
  fetchMyLoanHistory,
  fetchMyLoans,
  renewLoan,
  type ActiveLoanApi,
  type HistoryLoanApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'

type Tab = 'active' | 'history'

export function MyLoansPage() {
  const { session } = useAuth()
  const [tab, setTab] = useState<Tab>('active')
  const [loans, setLoans] = useState<ActiveLoanApi[]>([])
  const [history, setHistory] = useState<HistoryLoanApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function loadLoans() {
    const token = session?.token
    if (!token) return
    setLoading(true)
    Promise.all([fetchMyLoans(token), fetchMyLoanHistory(token)])
      .then(([active, hist]) => {
        setLoans(active)
        setHistory(hist.content)
      })
      .catch(() => setError('Không tải được phiếu mượn.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLoans()
  }, [session?.token])

  async function handleRenew(loanId: string) {
    const token = session?.token
    if (!token) return
    setError(null)
    try {
      await renewLoan(token, loanId)
      setToast('Gia hạn thành công.')
      loadLoans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gia hạn thất bại.')
    }
  }

  return (
    <>
      <PageHeader title="Phiếu mượn của tôi" />
      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === 'active' ? 'primary' : 'secondary'}
          onClick={() => setTab('active')}
        >
          Đang mượn
        </Button>
        <Button
          variant={tab === 'history' ? 'primary' : 'secondary'}
          onClick={() => setTab('history')}
        >
          Lịch sử
        </Button>
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-primary-dark/60">Đang tải…</p>
      ) : tab === 'active' ? (
        loans.length === 0 ? (
          <Card className="text-left text-slate-600">Bạn chưa mượn sách nào.</Card>
        ) : (
          <div className="space-y-4">
            {loans.map((l) => {
              const dueSoon =
                new Date(l.dueAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
              return (
                <Card key={l.loanId} className="text-left">
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <p className="font-semibold">{l.bookTitle}</p>
                      <p className="text-sm text-slate-600">
                        Hạn trả: {new Date(l.dueAt).toLocaleDateString('vi-VN')}
                      </p>
                      {l.renewalCount != null && l.renewalCount > 0 && (
                        <p className="text-xs text-slate-500">
                          Đã gia hạn {l.renewalCount} lần
                        </p>
                      )}
                      <p className="text-xs font-mono text-slate-500">{l.copyCode}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone={dueSoon ? 'warning' : 'success'}>
                        {dueSoon ? 'Sắp đến hạn' : 'Đang mượn'}
                      </Badge>
                      <Button variant="secondary" onClick={() => handleRenew(l.loanId)}>
                        Gia hạn
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : history.length === 0 ? (
        <Card className="text-left text-slate-600">Chưa có lịch sử mượn.</Card>
      ) : (
        <div className="space-y-4">
          {history.map((l) => (
            <Card key={l.loanId} className="text-left">
              <p className="font-semibold">{l.bookTitle}</p>
              <p className="text-sm text-slate-600">
                Mượn: {new Date(l.checkoutAt).toLocaleDateString('vi-VN')} — Trả:{' '}
                {new Date(l.returnedAt).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-xs font-mono text-slate-500">{l.copyCode}</p>
            </Card>
          ))}
        </div>
      )}
      {toast && <Toast message={toast} />}
    </>
  )
}
