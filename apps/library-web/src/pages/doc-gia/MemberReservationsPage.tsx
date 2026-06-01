import { useEffect, useState } from 'react'
import {
  cancelReservation,
  fetchMyReservations,
  type ReservationApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'

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
    fetchMyReservations(token)
      .then(setItems)
      .catch(() => setError('Không tải được danh sách đặt trước.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReservations()
  }, [session?.token])

  async function handleCancel(id: string) {
    const token = session?.token
    if (!token) return
    setError(null)
    try {
      await cancelReservation(token, id)
      setToast('Đã hủy đặt trước.')
      loadReservations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hủy thất bại.')
    }
  }

  function canCancel(status: string) {
    return status === 'PENDING' || status === 'READY'
  }

  return (
    <>
      <PageHeader title="Đặt trước" />
      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-primary-dark/60">Đang tải…</p>
      ) : items.length === 0 ? (
        <Card className="text-left text-slate-600">Bạn chưa có đặt trước nào.</Card>
      ) : (
        items.map((r) => (
          <Card key={r.id} className="mb-4 text-left">
            <p className="font-semibold">{r.bookTitle ?? `Sách ${r.bookId.slice(0, 8)}…`}</p>
            <p className="mt-1 text-sm text-slate-600">
              Vị trí hàng đợi: {r.queuePosition}
            </p>
            <Badge tone="warning" className="mt-3">
              {r.status}
            </Badge>
            {canCancel(r.status) && (
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => handleCancel(r.id)}
              >
                Hủy đặt trước
              </Button>
            )}
          </Card>
        ))
      )}
      {toast && <Toast message={toast} />}
    </>
  )
}
