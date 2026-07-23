import { useCallback, useEffect, useState } from 'react'
import {
  cancelReservation,
  createReservation,
  fetchBooks,
  fetchOpenReservations,
  fulfillReservation,
  lookupCopy,
  lookupMember,
  parseListResponse,
  type MemberLookupApi,
  type BookApiResponse,
  type ReservationApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useDebouncedLookup } from '../../hooks/useDebouncedLookup'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Toast } from '../../components/ui/Toast'
import { AlertCircle, CheckCircle2, Bookmark, X } from 'lucide-react'

export function ReservationsDeskPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const [books, setBooks] = useState<BookApiResponse[]>([])
  const [queue, setQueue] = useState<ReservationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [memberQuery, setMemberQuery] = useState('')
  const [selectedBookId, setSelectedBookId] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [fulfillId, setFulfillId] = useState<string | null>(null)
  const [copyCode, setCopyCode] = useState('')

  const memberLookupFn = useCallback(
    (q: string) => lookupMember(token, q),
    [token],
  )
  const memberLookup = useDebouncedLookup<MemberLookupApi>(memberQuery, memberLookupFn)

  async function loadQueue() {
    if (!token) return
    setLoading(true)
    try {
      const bookList = parseListResponse(await fetchBooks(token))
      setBooks(bookList)
      setQueue(await fetchOpenReservations(token))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [token])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!memberLookup.result || !selectedBookId) {
      setActionError('Chọn độc giả và sách trước.')
      return
    }
    setActionError(null)
    try {
      await createReservation(token, memberLookup.result.id, selectedBookId)
      setToast('Tạo đặt trước thành công.')
      setMemberQuery('')
      setSelectedBookId('')
      await loadQueue()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Tạo đặt trước thất bại.')
    }
  }

  async function handleCancel(id: string) {
    setActionError(null)
    try {
      await cancelReservation(token, id)
      setToast('Đã hủy yêu cầu đặt trước.')
      if (fulfillId === id) setFulfillId(null)
      await loadQueue()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể hủy đặt trước ở trạng thái hiện tại.')
    }
  }

  async function handleFulfill(reservationId: string) {
    setActionError(null)
    if (!copyCode.trim()) {
      setActionError('Vui lòng nhập Mã bản sao (Copy Code).')
      return
    }
    try {
      const copy = await lookupCopy(token, copyCode.trim())
      await fulfillReservation(token, reservationId, copy.id)
      setToast('Cấp sách thành công — đã tạo phiếu mượn tự động.')
      setFulfillId(null)
      setCopyCode('')
      await loadQueue()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cấp sách thất bại. Kiểm tra lại mã bản sao.')
    }
  }

  return (
    <>
      <PageHeader title="Quản lý Đặt trước" description="Xử lý danh sách độc giả đặt trước sách và cấp sách tại quầy." />

      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 p-4 text-sm text-amber-900 border border-amber-200 text-left animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-amber-700 hover:text-amber-900 p-1 rounded hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Form Tạo đặt trước tại quầy */}
      <Card className="mb-6 text-left border border-slate-200">
        <h2 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-purple-600" /> Tạo đặt trước mới cho Độc giả
        </h2>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Mã thẻ hoặc email độc giả"
            name="member"
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
            placeholder="VD: TV-2024-001 hoặc reader@lms.vn"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Đầu sách muốn đặt
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-hidden"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              required
            >
              <option value="">— Chọn đầu sách —</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
          {memberLookup.result && (
            <p className="text-sm font-medium text-emerald-700 sm:col-span-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Tìm thấy: {memberLookup.result.name} — Mã thẻ: {memberLookup.result.libraryCardId}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              Tạo đặt trước
            </Button>
          </div>
        </form>
      </Card>

      {/* Danh sách các yêu cầu Đặt trước đang chờ / sẵn sàng */}
      <Card className="space-y-4 text-left border border-slate-200">
        <h2 className="mb-2 text-base font-semibold text-slate-900">
          Danh sách yêu cầu Đặt trước đang chờ ({queue.length})
        </h2>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Đang tải danh sách đặt trước…</p>
        ) : queue.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
            <p className="font-medium text-slate-700">Không có yêu cầu đặt trước nào đang chờ.</p>
          </div>
        ) : (
          queue.map((q) => {
            const isFulfillingThis = fulfillId === q.id
            const isReady = q.status === 'READY'

            return (
              <div
                key={q.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">
                      {q.bookTitle ?? q.bookId}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Độc giả: <span className="font-medium text-slate-800">{q.memberName ?? '—'}</span> (Mã thẻ: {q.libraryCardId ?? q.memberId.slice(0, 8)})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={isReady ? 'success' : 'warning'}>
                      {isReady ? 'Sẵn sàng nhận' : `Vị trí chờ: #${q.queuePosition}`}
                    </Badge>

                    {isReady && !isFulfillingThis && (
                      <Button
                        className="text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                          setFulfillId(q.id)
                          setCopyCode('')
                          setActionError(null)
                        }}
                      >
                        Nhận sách
                      </Button>
                    )}

                    {!isFulfillingThis && (
                      <Button
                        variant="secondary"
                        className="text-xs py-1.5 px-3 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                        onClick={() => handleCancel(q.id)}
                      >
                        Hủy đặt trước
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline form khi bấm Nhận sách */}
                {isFulfillingThis && (
                  <div className="mt-2 rounded-xl border border-purple-200 bg-purple-50/70 p-3 animate-in fade-in">
                    <label className="block text-xs font-semibold text-purple-900 mb-1.5">
                      Nhập mã bản sao sách (Copy Code) để cấp phiếu mượn cho độc giả:
                    </label>
                    <div className="flex flex-wrap items-end gap-2">
                      <Input
                        label="Mã bản sao"
                        name="copyCode"
                        value={copyCode}
                        onChange={(e) => setCopyCode(e.target.value)}
                        placeholder="VD: BK-001"
                        className="max-w-xs text-sm bg-white"
                      />
                      <Button
                        className="text-xs py-2.5 bg-purple-600 text-white hover:bg-purple-700"
                        onClick={() => handleFulfill(q.id)}
                      >
                        Xác nhận cấp sách
                      </Button>
                      <Button
                        variant="secondary"
                        className="text-xs py-2.5"
                        onClick={() => {
                          setFulfillId(null)
                          setCopyCode('')
                          setActionError(null)
                        }}
                      >
                        Đóng
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </Card>

      {toast && <Toast message={toast} />}
    </>
  )
}

