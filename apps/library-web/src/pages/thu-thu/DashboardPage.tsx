import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchDashboardKpis,
  fetchOverdueLoans,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card, KpiCard } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n)
}

function formatDue(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

export function DashboardPage() {
  const { session } = useAuth()
  const [overdue, setOverdue] = useState<Awaited<ReturnType<typeof fetchOverdueLoans>>>([])
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof fetchDashboardKpis>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    const token = session?.token
    if (!token) return

    let cancelled = false
    setLoading(true)
    setApiError(null)

    Promise.all([fetchOverdueLoans(token), fetchDashboardKpis(token)])
      .then(([overdueLoans, dashboardKpis]) => {
        if (cancelled) return
        setOverdue(overdueLoans)
        setKpis(dashboardKpis)
      })
      .catch(() => {
        if (!cancelled) {
          setApiError('Không tải được dữ liệu từ API. Kiểm tra backend đang chạy.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session?.token])

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        description="Tổng quan hoạt động thư viện (dữ liệu từ API)"
        action={
          <Link to="/thu-thu/muon-tra">
            <Button>Mượn sách</Button>
          </Link>
        }
      />

      {apiError && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {apiError}
        </p>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Mượn hôm nay"
          value={loading ? '…' : (kpis?.checkoutsToday ?? 0)}
          hint="Từ /api/reports/dashboard-kpis"
        />
        <KpiCard
          label="Phiếu quá hạn"
          value={loading ? '…' : overdue.length}
          hint="Từ /api/reports/overdue"
          hintTone="danger"
        />
        <KpiCard
          label="Đặt trước chờ"
          value={loading ? '…' : (kpis?.pendingReservations ?? 0)}
          hint="Từ /api/reports/dashboard-kpis"
          hintTone="warning"
        />
        <KpiCard
          label="Phạt chưa thu"
          value={loading ? '…' : formatVnd(kpis?.unpaidFineTotal ?? 0)}
          hint="Từ /api/reports/dashboard-kpis"
          hintTone="warning"
        />
      </div>

      <Card className="text-left">
        <h2 className="mb-4 text-lg font-semibold text-primary-dark">
          Phiếu quá hạn
        </h2>
        {loading ? (
          <p className="text-sm text-primary-dark/60">Đang tải…</p>
        ) : overdue.length === 0 ? (
          <p className="text-sm text-primary-dark/60">Không có phiếu quá hạn.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-violet-50 text-primary-dark">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã thẻ</th>
                  <th className="px-4 py-3 font-semibold">Mã bản</th>
                  <th className="px-4 py-3 font-semibold">Hạn trả</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((loan) => (
                  <tr
                    key={loan.loanId}
                    className="border-t border-violet-50 hover:bg-violet-50/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {loan.libraryCardId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{loan.copyCode}</td>
                    <td className="px-4 py-3">{formatDue(loan.dueAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone="danger">Quá hạn</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
