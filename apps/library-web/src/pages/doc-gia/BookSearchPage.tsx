import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'
import { Search, BookOpen, BookmarkPlus, Check, X, Filter, RefreshCw } from 'lucide-react'

// Remove Vietnamese accents and convert to lowercase for flexible search
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

export function BookSearchPage() {
  const { session } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [allBooks, setAllBooks] = useState<BookApiResponse[]>([])
  const [reservations, setReservations] = useState<ReservationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [q, setQ] = useState(() => searchParams.get('q') ?? '')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const loadData = () => {
    const token = session?.token
    if (!token) return

    setLoading(true)
    setError(null)

    // Fetch books independently so catalog always loads
    fetchBooks(token, { activeOnly: true })
      .then((bookList) => {
        setAllBooks(parseListResponse(bookList))
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ API.')
      })
      .finally(() => setLoading(false))

    fetchMyReservations(token)
      .then((myReservations) => {
        setReservations(myReservations)
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadData()
  }, [session?.token])

  // Keep search input synced if URL searchParams change
  useEffect(() => {
    const urlQ = searchParams.get('q')
    if (urlQ !== null && urlQ !== q) {
      setQ(urlQ)
    }
  }, [searchParams])

  // Extract unique categories from loaded books
  const categories = Array.from(new Set(allBooks.map((b) => b.category).filter(Boolean)))

  // Filter books locally with Vietnamese accent normalization & category filter
  const filteredBooks = allBooks.filter((b) => {
    if (selectedCategory && b.category !== selectedCategory) {
      return false
    }
    if (q.trim()) {
      const qNorm = removeAccents(q.trim())
      const titleNorm = removeAccents(b.title || '')
      const authorsNorm = removeAccents(b.authors || '')
      const categoryNorm = removeAccents(b.category || '')
      const isbnNorm = removeAccents(b.isbn || '')

      return (
        titleNorm.includes(qNorm) ||
        authorsNorm.includes(qNorm) ||
        categoryNorm.includes(qNorm) ||
        isbnNorm.includes(qNorm)
      )
    }
    return true
  })

  function hasOpenReservation(bookId: string) {
    return reservations.some(
      (r) => r.bookId === bookId && (r.status === 'PENDING' || r.status === 'READY'),
    )
  }

  async function handleReserve(bookId: string, bookTitle: string) {
    const token = session?.token
    if (!token) return
    setError(null)
    try {
      await createMyReservation(token, bookId)
      setToast(`Đã đặt trước thành công sách "${bookTitle}".`)
      const myReservations = await fetchMyReservations(token)
      setReservations(myReservations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt trước thất bại.')
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageHeader
            title={`Danh sách sách trong thư viện (${allBooks.length} đầu sách)`}
            description="Tra cứu, tìm kiếm theo tên, tác giả, thể loại và đặt trước sách nhanh chóng."
          />
        </div>
        <Button variant="secondary" className="text-xs py-1.5" onClick={loadData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Tải lại danh sách
        </Button>
      </div>

      {/* Search Bar & Category Filter Pills */}
      <div className="mb-6 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/70 via-white to-purple-50/40 p-4 shadow-sm text-left">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                if (searchParams.has('q')) {
                  setSearchParams({})
                }
              }}
              placeholder="Nhập tên sách (ví dụ: Nhà giả kim, Sapiens, Clean Code...), tác giả, thể loại hoặc ISBN..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder-slate-400 shadow-xs transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ('')
                  setSearchParams({})
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clear Filter Button */}
          {(selectedCategory || q) && (
            <Button
              variant="secondary"
              onClick={() => {
                setQ('')
                setSelectedCategory('')
                setSearchParams({})
              }}
              className="whitespace-nowrap text-xs"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Quick Category Filter Pills */}
        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-violet-100/80">
            <span className="mr-1 flex items-center gap-1 text-xs font-medium text-slate-500">
              <Filter className="h-3 w-3" /> Thể loại:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedCategory === ''
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất cả ({allBooks.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 p-3 text-sm text-amber-900 border border-amber-200">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-amber-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Đang tải danh sách sách...</div>
      ) : filteredBooks.length === 0 ? (
        <Card className="py-12 text-center">
          <BookOpen className="mx-auto mb-2 h-10 w-10 text-slate-300" />
          <p className="text-slate-600 font-medium">Không tìm thấy sách phù hợp.</p>
          <p className="mt-1 text-xs text-slate-400">
            {q || selectedCategory
              ? 'Thử tìm kiếm với từ khóa khác hoặc bấm nút "Xóa bộ lọc".'
              : 'Thư viện chưa có dữ liệu sách.'}
          </p>
          {(q || selectedCategory) && (
            <Button
              variant="secondary"
              className="mt-4 text-xs"
              onClick={() => {
                setQ('')
                setSelectedCategory('')
                setSearchParams({})
              }}
            >
              Xem tất cả {allBooks.length} cuốn sách
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((b) => {
            const available = (b.availableCount ?? 0) > 0
            const reserved = hasOpenReservation(b.id)
            const canReserve = !available && !reserved

            return (
              <Card
                key={b.id}
                className="group relative flex flex-col justify-between text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md border border-slate-200/80 hover:border-violet-300"
              >
                <div>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                      {b.category || 'Khác'}
                    </span>
                    <Badge tone={available ? 'success' : 'warning'}>
                      {available ? `Còn ${b.availableCount} bản` : 'Hết sách'}
                    </Badge>
                  </div>

                  <h3 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-primary transition">
                    {b.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-1">{b.authors}</p>
                  {b.isbn && <p className="mt-2 text-xs font-mono text-slate-400">ISBN: {b.isbn}</p>}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Tổng: {b.totalCopies ?? '—'} bản
                  </span>

                  {canReserve && (
                    <Button
                      variant="secondary"
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5"
                      onClick={() => handleReserve(b.id, b.title)}
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" />
                      Đặt trước
                    </Button>
                  )}

                  {reserved && (
                    <span className="flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md">
                      <Check className="h-3.5 w-3.5" /> Đã đặt trước
                    </span>
                  )}

                  {available && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                      Có sẵn tại thư viện
                    </span>
                  )}
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

