import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchMyNotifications,
  fetchStaffNotifications,
  fetchMyFines,
  fetchMyLoans,
  fetchMyReservations,
  type NotificationApi,
  type FineApi,
  type ActiveLoanApi,
  type ReservationApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { QrPaymentModal } from '../../components/fines/QrPaymentModal'
import {
  Bell,
  AlertTriangle,
  Clock,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Info,
  Check,
  BookmarkPlus,
} from 'lucide-react'

export interface DisplayNotification {
  id: string
  type: 'FINE' | 'DUE_SOON' | 'OVERDUE' | 'RESERVATION_READY' | 'SYSTEM'
  title: string
  content: string
  date: string
  isRead: boolean
  actionText?: string
  actionUrl?: string
  fineAmount?: number
  fineId?: string
}

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NotificationsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const isStaff = session?.user.role === 'ADMIN' || session?.user.role === 'LIBRARIAN'

  const [notifications, setNotifications] = useState<DisplayNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'FINE' | 'LOAN' | 'RESERVATION'>('ALL')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean
    amount: number
    fineId?: string
    title?: string
    transferNote?: string
  }>({
    isOpen: false,
    amount: 0,
  })

  const loadAllNotifications = async () => {
    if (!token) return
    setLoading(true)

    try {
      if (isStaff) {
        const staffNotifs = await fetchStaffNotifications(token).catch(() => ({ content: [] }))
        const list: DisplayNotification[] = staffNotifs.content.map((n: NotificationApi) => ({
          id: n.id,
          type: (n.type as any) || 'SYSTEM',
          title: getNotificationTitle(n.type),
          content: `Thông báo hệ thống từ thư viện (${n.type})`,
          date: n.createdAt,
          isRead: false,
        }))
        setNotifications(list)
      } else {
        // Member notifications: combine backend notifications + live status items (fines, due loans, reservations)
        const [backendNotifs, fines, loans, reservations] = await Promise.all([
          fetchMyNotifications(token).catch(() => ({ content: [] })),
          fetchMyFines(token).catch(() => []),
          fetchMyLoans(token).catch(() => []),
          fetchMyReservations(token).catch(() => []),
        ])

        const combined: DisplayNotification[] = []

        // 1. Add Unpaid Fines Notifications
        const unpaidFines = (fines as FineApi[]).filter((f) => f.status === 'UNPAID')
        unpaidFines.forEach((f) => {
          combined.push({
            id: `fine-${f.id}`,
            type: 'FINE',
            title: 'Khoản tiền phạt chưa thanh toán',
            content: `Bạn có khoản tiền phạt ${formatVnd(
              f.amount
            )} chưa thu. Bạn có thể mở mã VietQR để thanh toán nhanh ngay bây giờ.`,
            date: new Date().toISOString(),
            isRead: false,
            actionText: 'Thanh toán QR ngay',
            fineAmount: f.amount,
            fineId: f.id,
          })
        })

        // 2. Add Loans Due / Overdue Notifications
        const now = new Date()
        ;(loans as ActiveLoanApi[]).forEach((l) => {
          const due = new Date(l.dueAt)
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24))

          if (diffDays < 0) {
            combined.push({
              id: `loan-overdue-${l.loanId}`,
              type: 'OVERDUE',
              title: `Quá hạn trả sách: ${l.bookTitle}`,
              content: `Sách "${l.bookTitle}" (Mã: ${l.copyCode}) đã quá hạn trả từ ngày ${formatDate(
                l.dueAt
              )}. Vui lòng mang sách trả lại thư viện để tránh phát sinh thêm phí phạt.`,
              date: l.dueAt,
              isRead: false,
              actionText: 'Xem phiếu mượn',
              actionUrl: '/doc-gia/phieu-muon',
            })
          } else if (diffDays <= 3) {
            combined.push({
              id: `loan-due-${l.loanId}`,
              type: 'DUE_SOON',
              title: `Sắp đến hạn trả sách: ${l.bookTitle}`,
              content: `Sách "${l.bookTitle}" (Mã: ${l.copyCode}) còn ${diffDays} ngày nữa là đến hạn trả (${formatDate(
                l.dueAt
              )}).`,
              date: l.dueAt,
              isRead: false,
              actionText: 'Xem phiếu mượn',
              actionUrl: '/doc-gia/phieu-muon',
            })
          }
        })

        // 3. Add Reservation Notifications
        ;(reservations as ReservationApi[]).forEach((r) => {
          if (r.status === 'READY') {
            combined.push({
              id: `res-${r.id}`,
              type: 'RESERVATION_READY',
              title: `Sách đặt trước đã sẵn sàng: ${r.bookTitle || 'Sách mượn'}`,
              content: `Sách bạn đặt trước đã sẵn sàng phục vụ. Vui lòng mang thẻ thư viện đến quầy để nhận sách.`,
              date: new Date().toISOString(),
              isRead: false,
              actionText: 'Xem danh sách đặt trước',
              actionUrl: '/doc-gia/dat-truoc',
            })
          }
        })

        // 4. Add Backend Notifications
        backendNotifs.content.forEach((n: NotificationApi) => {
          if (!combined.some((item) => item.id === n.id)) {
            combined.push({
              id: n.id,
              type: (n.type as any) || 'SYSTEM',
              title: getNotificationTitle(n.type),
              content: `Thông báo cập nhật cho tài khoản của bạn (${getNotificationTitle(n.type)})`,
              date: n.createdAt,
              isRead: false,
            })
          }
        })

        // 5. System Welcome Notification if list empty
        if (combined.length === 0) {
          combined.push({
            id: 'sys-welcome',
            type: 'SYSTEM',
            title: 'Chào mừng bạn đến với Thư viện LMS Độc giả!',
            content:
              'Hiện tài khoản của bạn không có khoản phạt hay sách quá hạn. Bạn có thể sử dụng các chức năng mượn sách, tìm kiếm và đặt trước sách trực tuyến bất cứ lúc nào.',
            date: new Date().toISOString(),
            isRead: true,
          })
        }

        setNotifications(combined)
      }
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllNotifications()
  }, [token, isStaff])

  function getNotificationTitle(type: string) {
    switch (type) {
      case 'RESERVATION_READY':
        return 'Sách đặt trước đã sẵn sàng'
      case 'DUE_REMINDER':
      case 'DUE_SOON':
        return 'Nhắc hạn trả sách'
      case 'OVERDUE':
        return 'Quá hạn trả sách'
      case 'FINE':
        return 'Thông báo khoản tiền phạt'
      default:
        return 'Thông báo từ thư viện'
    }
  }

  const markAsRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id))
  }

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id)
    setReadIds(new Set(allIds))
  }

  const filteredNotifications = notifications.filter((item) => {
    const isRead = item.isRead || readIds.has(item.id)

    if (filterTab === 'UNREAD') return !isRead
    if (filterTab === 'FINE') return item.type === 'FINE'
    if (filterTab === 'LOAN') return item.type === 'DUE_SOON' || item.type === 'OVERDUE'
    if (filterTab === 'RESERVATION') return item.type === 'RESERVATION_READY'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead && !readIds.has(n.id)).length

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-left">
        <div>
          <PageHeader
            title="Thông báo hệ thống"
            description="Cập nhật tự động thông tin hạn trả sách, khoản tiền phạt VietQR và trạng thái đặt trước."
          />
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" className="text-xs py-1.5" onClick={markAllAsRead}>
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Đánh dấu đã đọc tất cả ({unreadCount})
            </Button>
          )}
          <Button variant="secondary" className="text-xs py-1.5" onClick={loadAllNotifications}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Tải lại thông báo
          </Button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-left">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            filterTab === 'ALL'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Tất cả ({notifications.length})
        </button>
        {unreadCount > 0 && (
          <button
            onClick={() => setFilterTab('UNREAD')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterTab === 'UNREAD'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
        )}
        <button
          onClick={() => setFilterTab('FINE')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            filterTab === 'FINE'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Tiền phạt & QR
        </button>
        <button
          onClick={() => setFilterTab('LOAN')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            filterTab === 'LOAN'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Hạn mượn sách
        </button>
        <button
          onClick={() => setFilterTab('RESERVATION')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            filterTab === 'RESERVATION'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Đặt sách trước
        </button>
      </div>

      {/* Main List Area */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Đang tải thông báo...</div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="py-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h3 className="text-base font-semibold text-slate-900">Không có thông báo nào!</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Hiện bạn không có thông báo thuộc danh mục này.
          </p>
        </Card>
      ) : (
        <div className="space-y-4 text-left">
          {filteredNotifications.map((n) => {
            const isRead = n.isRead || readIds.has(n.id)

            // Render specific icon based on type
            let iconBox = <Bell className="h-5 w-5 text-indigo-600" />
            let bgStyle = 'border-slate-200 bg-white'
            let badgeTone: 'danger' | 'warning' | 'success' | 'neutral' = 'neutral'

            if (n.type === 'FINE') {
              iconBox = <AlertTriangle className="h-5 w-5 text-amber-600" />
              bgStyle = 'border-amber-200 bg-gradient-to-r from-amber-50/50 via-white to-white'
              badgeTone = 'danger'
            } else if (n.type === 'OVERDUE') {
              iconBox = <Clock className="h-5 w-5 text-rose-600" />
              bgStyle = 'border-rose-200 bg-gradient-to-r from-rose-50/40 via-white to-white'
              badgeTone = 'danger'
            } else if (n.type === 'DUE_SOON') {
              iconBox = <Clock className="h-5 w-5 text-purple-600" />
              bgStyle = 'border-purple-200 bg-gradient-to-r from-purple-50/40 via-white to-white'
              badgeTone = 'warning'
            } else if (n.type === 'RESERVATION_READY') {
              iconBox = <BookmarkPlus className="h-5 w-5 text-emerald-600" />
              bgStyle = 'border-emerald-200 bg-gradient-to-r from-emerald-50/40 via-white to-white'
              badgeTone = 'success'
            }

            return (
              <Card
                key={n.id}
                className={`relative transition border ${bgStyle} ${
                  !isRead ? 'ring-2 ring-purple-400/30 shadow-xs' : 'opacity-90'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-slate-100">
                      {iconBox}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{n.title}</h3>
                        {!isRead && (
                          <span className="h-2 w-2 rounded-full bg-purple-600 ring-2 ring-purple-200" />
                        )}
                      </div>

                      <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{n.content}</p>

                      <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                        <Info className="h-3 w-3 text-slate-400" /> {formatDate(n.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end shrink-0">
                    <Badge tone={badgeTone}>
                      {n.type === 'FINE'
                        ? 'Tiền phạt'
                        : n.type === 'OVERDUE'
                        ? 'Quá hạn'
                        : n.type === 'DUE_SOON'
                        ? 'Sắp hết hạn'
                        : n.type === 'RESERVATION_READY'
                        ? 'Đặt trước sẵn sàng'
                        : 'Thông báo'}
                    </Badge>

                    {/* Action Button: QR Payment or Navigation Link */}
                    {n.type === 'FINE' && n.fineAmount && (
                      <Button
                        className="mt-1 text-xs py-1.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-xs"
                        onClick={() => {
                          markAsRead(n.id)
                          setQrModalData({
                            isOpen: true,
                            amount: n.fineAmount!,
                            fineId: n.fineId,
                            title: `Thanh toán khoản tiền phạt ${formatVnd(n.fineAmount!)}`,
                            transferNote: n.fineId
                              ? `THANH TOAN PHAT FINE ${n.fineId.replaceAll('-', '').slice(0, 8).toUpperCase()}`
                              : `THANH TOAN PHAT THU VIEN`,
                          })
                        }}
                      >
                        <QrCode className="h-3.5 w-3.5 mr-1" /> Thanh toán QR ngay
                      </Button>
                    )}

                    {n.actionUrl && (
                      <Link to={n.actionUrl} onClick={() => markAsRead(n.id)}>
                        <Button variant="secondary" className="mt-1 text-xs py-1.5 px-3">
                          <BookOpen className="h-3.5 w-3.5 mr-1" /> {n.actionText || 'Xem chi tiết'}
                        </Button>
                      </Link>
                    )}

                    {!isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline mt-1"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Embedded QR Payment Modal */}
      <QrPaymentModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData({ ...qrModalData, isOpen: false })}
        amount={qrModalData.amount}
        fineId={qrModalData.fineId}
        title={qrModalData.title}
        transferNote={qrModalData.transferNote}
        onPaymentSuccess={() => {
          loadAllNotifications()
        }}
      />
    </>
  )
}
