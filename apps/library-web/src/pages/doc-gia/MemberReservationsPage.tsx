import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  cancelReservation,
  fetchMyReservations,
  type ReservationApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, KpiCard } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'
import {
  Bookmark,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  BookOpen,
} from 'lucide-react'

export function MemberReservationsPage() {
  const { session } = useAuth()
  const [items, setItems] = useState<ReservationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function loadReservations() {
    const token = session?.token
    if (!token) return
    setLoading(true)
    setError(null)
    fetchMyReservations(token)
      .then((data) => {
        setItems(data)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không tải được danh sách đặt trước.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReservations()
  }, [session?.token])

  async function handleCancel(id: string, title?: string) {
    const token = session?.token
    if (!token) return
    setError(null)
    try {
      await cancelReservation(token, id)
      setToast(`Đã hủy đặt trước sách ${title ? `"${title}"` : ''}.`)
      loadReservations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hủy đặt trước thất bại.')
    }
  }

  function canCancel(status: string) {
    return status === 'PENDING' || status === 'READY'
  }

  const pendingCount = items.filter((i) => i.status === 'PENDING').length
  const readyCount = items.filter((i) => i.status === 'READY').length

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-left">
        <div>
          <PageHeader
            title="Sách đặt trước của tôi"
            description="Theo dõi danh sách các cuốn sách bạn đang xếp hàng chờ mượn hoặc đã sẵn sàng nhận."
          />
        </div>
        <Button variant="secondary" className="text-xs py-1.5" onClick={loadReservations}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Tải lại danh sách
        </Button>
      </div>

      {/* Summary KPI stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Tổng lượt đặt" value={items.length} />
        <KpiCard label="Đang chờ xếp hàng" value={pendingCount} hintTone="warning" />
        <KpiCard label="Sẵn sàng nhận" value={readyCount} hintTone="neutral" />
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 p-4 text-sm text-amber-900 border border-amber-200 text-left">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" className="text-xs py-1" onClick={loadReservations}>
            Thử lại
          </Button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Đang tải danh sách đặt trước...</div>
      ) : items.length === 0 ? (
        <Card className="py-12 text-center">
          <Bookmark className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-900">Bạn chưa có đặt trước nào</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Khi một cuốn sách trong thư viện đang hết bản in, bạn có thể đặt trước sách để được xếp hàng mượn ngay khi có sách.
          </p>
          <Link to="/doc-gia/tim-sach" className="mt-5 inline-block">
            <Button className="flex items-center gap-2 text-sm shadow-xs">
              <Search className="h-4 w-4" /> Tìm & Đặt trước sách ngay
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4 text-left">
          {items.map((r) => {
            const isReady = r.status === 'READY'
            const isPending = r.status === 'PENDING'
            const isFulfilled = r.status === 'FULFILLED'
            const isCancelled = r.status === 'CANCELLED'

            return (
              <Card
                key={r.id}
                className={`relative transition border ${
                  isReady
                    ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/40 via-white to-white shadow-xs'
                    : 'border-slate-200/80 hover:border-violet-200'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isReady
                          ? 'bg-emerald-100 text-emerald-700'
                          : isPending
                          ? 'bg-amber-100 text-amber-700'
                          : isFulfilled
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isReady ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isPending ? (
                        <Clock className="h-5 w-5" />
                      ) : isFulfilled ? (
                        <BookOpen className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {r.bookTitle ?? `Sách ID: ${r.bookId}`}
                      </h3>

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        {isPending && (
                          <span className="flex items-center gap-1 font-medium text-amber-700">
                            <Clock className="h-3.5 w-3.5" /> Vị trí hàng đợi: #{r.queuePosition}
                          </span>
                        )}

                        {isReady && (
                          <span className="flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Sách đã sẵn sàng tại quầy!
                          </span>
                        )}

                        {isFulfilled && <span className="text-slate-500">Đã nhận sách thành công</span>}

                        {isCancelled && <span className="text-slate-400">Yêu cầu đã hủy</span>}
                      </div>

                      {isReady && (
                        <div className="mt-3 rounded-lg bg-emerald-100/60 p-2.5 text-xs text-emerald-900 border border-emerald-200">
                          🎉 <strong>Sách đã sẵn sàng!</strong> Vui lòng mang thẻ độc giả đến quầy thủ thư để nhận sách trong thời gian sớm nhất.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end shrink-0">
                    <Badge tone={isReady ? 'success' : isPending ? 'warning' : 'neutral'}>
                      {isReady
                        ? 'Sẵn sàng nhận'
                        : isPending
                        ? 'Đang chờ mượn'
                        : isFulfilled
                        ? 'Đã hoàn tất'
                        : 'Đã hủy'}
                    </Badge>

                    {canCancel(r.status) && (
                      <Button
                        variant="secondary"
                        className="text-xs py-1.5 px-3 mt-1 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                        onClick={() => handleCancel(r.id, r.bookTitle)}
                      >
                        Hủy đặt trước
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {toast && <Toast message={toast} />}
    </>
  )
}

