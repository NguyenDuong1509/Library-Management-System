import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchMyFines,
  fetchMyLoans,
  fetchMyReservations,
  fetchTopBooks,
  type TopBookApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Card, KpiCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Sparkles, BookOpen, ArrowRight, TrendingUp, RefreshCw } from 'lucide-react'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export function HomePage() {
  const { session } = useAuth()
  const [loanCount, setLoanCount] = useState(0)
  const [reservationCount, setReservationCount] = useState(0)
  const [fineTotal, setFineTotal] = useState(0)
  const [topBooks, setTopBooks] = useState<TopBookApi[]>([])
  const [loadingTop, setLoadingTop] = useState(true)

  const loadData = () => {
    const token = session?.token
    if (!token) return

    fetchMyLoans(token)
      .then((loans) => setLoanCount(loans.length))
      .catch(() => {})

    fetchMyReservations(token)
      .then((reservations) => setReservationCount(reservations.length))
      .catch(() => {})

    fetchMyFines(token)
      .then((fines) => setFineTotal(fines.reduce((sum, f) => sum + f.amount, 0)))
      .catch(() => {})

    setLoadingTop(true)
    fetchTopBooks(token, 10)
      .then(setTopBooks)
      .catch(() => setTopBooks([]))
      .finally(() => setLoadingTop(false))
  }

  useEffect(() => {
    loadData()
  }, [session?.token])

  return (
    <>
      {/* Header section */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Xin chào, {session?.user.name} 👋
          </h1>
          <p className="mt-1 text-slate-600">
            Bạn đang mượn <span className="font-semibold text-primary">{loanCount}</span> cuốn sách trong hệ thống.
          </p>
        </div>
        <Button variant="secondary" className="text-xs py-1.5" onClick={loadData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Tải lại dữ liệu
        </Button>
      </div>

      {/* KPI stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Đang mượn" value={loanCount} />
        <KpiCard label="Đặt trước" value={reservationCount} hintTone="warning" />
        <KpiCard label="Phạt chưa thu" value={formatVnd(fineTotal)} />
      </div>

      {/* SECTION 1: Sách thịnh hành được mượn nhiều nhất */}
      <section className="mb-8 text-left">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Sách thịnh hành được mượn nhiều
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Những đầu sách được nhiều độc giả quan tâm và mượn đọc nhất trong thư viện.
            </p>
          </div>
          <Link to="/doc-gia/tim-sach">
            <Button className="flex items-center gap-1.5 text-xs py-2">
              <BookOpen className="h-4 w-4" />
              Xem tất cả kho sách &rarr;
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden p-0 text-left border border-slate-200/80 shadow-xs">
          {loadingTop ? (
            <div className="p-8 text-center text-sm text-slate-500">Đang tải danh sách sách thịnh hành...</div>
          ) : topBooks.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <TrendingUp className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="font-medium text-slate-600">Chưa có dữ liệu sách thịnh hành.</p>
              <p className="mt-1 text-xs text-slate-400">Xem toàn bộ danh sách tại mục "Tìm sách".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gradient-to-r from-violet-50 to-purple-50 text-primary-dark">
                  <tr>
                    <th className="w-16 px-5 py-3.5 font-semibold">#</th>
                    <th className="px-5 py-3.5 font-semibold">Đầu sách</th>
                    <th className="px-5 py-3.5 text-center font-semibold">Lượt mượn</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topBooks.map((book, index) => (
                    <tr key={book.bookId} className="transition hover:bg-violet-50/40">
                      <td className="px-5 py-4 font-bold text-primary">#{index + 1}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{book.title}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
                          {book.loanCount} lượt
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link to={`/doc-gia/tim-sach?q=${encodeURIComponent(book.title)}`}>
                          <Button variant="secondary" className="text-xs py-1.5 px-3">
                            Xem / Đặt trước
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* Quick Navigation Card Banner to Tim sach */}
      <Card className="rounded-2xl border border-violet-100 bg-gradient-to-r from-purple-50 via-white to-violet-50 p-6 text-left shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <BookOpen className="h-5 w-5 text-primary" />
              Tra cứu & Đặt trước toàn bộ sách trong thư viện
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Chuyển sang mục <strong>Tìm sách</strong> để xem danh sách 6 đầu sách, lọc theo thể loại và đặt trước sách.
            </p>
          </div>
          <Link to="/doc-gia/tim-sach" className="shrink-0">
            <Button className="flex items-center gap-2 shadow-xs">
              Đến trang Tìm sách <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </>
  )
}





