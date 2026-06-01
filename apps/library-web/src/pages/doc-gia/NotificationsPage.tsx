import { useEffect, useState } from 'react'
import {
  fetchMyNotifications,
  fetchStaffNotifications,
  type NotificationApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'

function notificationLabel(type: string) {
  switch (type) {
    case 'RESERVATION_READY':
      return 'Sách đặt trước đã sẵn sàng'
    case 'DUE_REMINDER':
      return 'Nhắc hạn trả sách'
    case 'OVERDUE':
      return 'Quá hạn trả sách'
    default:
      return type
  }
}

export function NotificationsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const isStaff =
    session?.user.role === 'ADMIN' || session?.user.role === 'LIBRARIAN'
  const [items, setItems] = useState<NotificationApi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    const fetcher = isStaff ? fetchStaffNotifications : fetchMyNotifications
    fetcher(token)
      .then((page) => setItems(page.content))
      .finally(() => setLoading(false))
  }, [token, isStaff])

  return (
    <>
      <PageHeader
        title="Thông báo"
        description={isStaff ? 'Nhật ký thông báo hệ thống' : 'Thông báo của bạn'}
      />
      {loading ? (
        <p className="text-sm text-primary-dark/60">Đang tải…</p>
      ) : items.length === 0 ? (
        <Card className="text-left text-slate-600">Chưa có thông báo.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card key={n.id} className="text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{notificationLabel(n.type)}</p>
                <Badge tone="neutral">{n.type}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {new Date(n.createdAt).toLocaleString('vi-VN')}
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
