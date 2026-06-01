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
      setToast('Đã hủy đặt trước.')
      await loadQueue()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Hủy thất bại.')
    }
  }

  async function handleFulfill(reservationId: string) {
    setActionError(null)
    try {
      const copy = await lookupCopy(token, copyCode.trim())
      await fulfillReservation(token, reservationId, copy.id)
      setToast('Nhận sách thành công — đã tạo phiếu mượn.')
      setFulfillId(null)
      setCopyCode('')
      await loadQueue()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Nhận sách thất bại.')
    }
  }

  return (
    <>
      <PageHeader title="Đặt trước" description="Hàng đợi theo đầu sách" />
      {actionError && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {actionError}
        </p>
      )}

      <Card className="mb-6 text-left">
        <h2 className="mb-4 font-semibold">Tạo đặt trước</h2>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Mã thẻ hoặc email độc giả"
            name="member"
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
            placeholder="TV-2024-001"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-primary-dark">
              Đầu sách
            </label>
            <select
              className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              required
            >
              <option value="">— Chọn sách —</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
          {memberLookup.result && (
            <p className="text-sm text-primary-dark/70 sm:col-span-2">
              {memberLookup.result.name} — {memberLookup.result.libraryCardId}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit">Tạo đặt trước</Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 text-left">
        {loading ? (
          <p className="text-sm text-primary-dark/60">Đang tải…</p>
        ) : queue.length === 0 ? (
          <p className="text-sm text-primary-dark/60">Không có đặt trước đang chờ.</p>
        ) : (
          queue.map((q) => (
            <div
              key={q.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-50 pb-4 last:border-0"
            >
              <div>
                <p className="font-medium">{q.bookTitle ?? q.bookId}</p>
                <p className="text-sm text-primary-dark/70">
                  {q.memberName ?? '—'} — {q.libraryCardId ?? q.memberId.slice(0, 8)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={q.status === 'READY' ? 'success' : 'warning'}>
                  {q.status === 'READY' ? 'Sẵn sàng' : `Vị trí ${q.queuePosition}`}
                </Badge>
                {q.status === 'READY' && (
                  fulfillId === q.id ? (
                    <div className="flex flex-wrap items-end gap-2">
                      <Input
                        label="Mã bản sao"
                        value={copyCode}
                        onChange={(e) => setCopyCode(e.target.value)}
                        placeholder="BK-..."
                      />
                      <Button onClick={() => handleFulfill(q.id)}>Xác nhận</Button>
                      <Button variant="secondary" onClick={() => setFulfillId(null)}>
                        Hủy
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setFulfillId(q.id)}>Nhận sách</Button>
                  )
                )}
                <Button variant="secondary" onClick={() => handleCancel(q.id)}>
                  Hủy
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
      {toast && <Toast message={toast} />}
    </>
  )
}
