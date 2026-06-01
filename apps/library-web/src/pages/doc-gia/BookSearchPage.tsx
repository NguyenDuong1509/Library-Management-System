import { useEffect, useState } from 'react'
import {
  createMyReservation,
  fetchBooks,
  fetchMyReservations,
  parseListResponse,
  type BookApiResponse,
  type ReservationApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'

export function BookSearchPage() {
  const { session } = useAuth()
  const [books, setBooks] = useState<BookApiResponse[]>([])
  const [reservations, setReservations] = useState<ReservationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    const token = session?.token
    if (!token) return

    setLoading(true)
    Promise.all([
      fetchBooks(token, { activeOnly: true, q: q || undefined, category: category || undefined }),
      fetchMyReservations(token),
    ])
      .then(([bookList, myReservations]) => {
        setBooks(parseListResponse(bookList))
        setReservations(myReservations)
      })
      .finally(() => setLoading(false))
  }, [session?.token, q, category])

  function hasOpenReservation(bookId: string) {
    return reservations.some(
      (r) =>
        r.bookId === bookId &&
        (r.status === 'PENDING' || r.status === 'READY'),
    )
  }

  async function handleReserve(bookId: string) {
    const token = session?.token
    if (!token) return
    setError(null)
    try {
      await createMyReservation(token, bookId)
      setToast('Đặt trước thành công.')
      const myReservations = await fetchMyReservations(token)
      setReservations(myReservations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt trước thất bại.')
    }
  }

  return (
    <>
      <PageHeader title="Tìm sách" description="Tra cứu trong danh mục thư viện" />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Input
          label="Tìm kiếm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tiêu đề, tác giả, ISBN…"
        />
        <Input
          label="Thể loại"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Văn học, Khoa học…"
        />
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-primary-dark/60">Đang tải…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => {
            const available = (b.availableCount ?? 0) > 0
            const reserved = hasOpenReservation(b.id)
            const canReserve = !available && !reserved
            return (
              <Card key={b.id} className="text-left">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{b.title}</h3>
                  <Badge tone={available ? 'success' : 'warning'}>
                    {available ? 'Còn sách' : 'Hết sách'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{b.authors}</p>
                <p className="mt-2 text-xs text-slate-500">{b.category}</p>
                {b.availableCount != null && (
                  <p className="mt-1 text-xs text-slate-500">
                    Còn {b.availableCount} / {b.totalCopies ?? '—'} bản
                  </p>
                )}
                {canReserve && (
                  <Button
                    className="mt-4"
                    variant="secondary"
                    onClick={() => handleReserve(b.id)}
                  >
                    Đặt trước
                  </Button>
                )}
                {reserved && (
                  <p className="mt-4 text-xs text-violet-700">Bạn đã đặt trước đầu sách này</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
      {toast && <Toast message={toast} />}
    </>
  )
}
