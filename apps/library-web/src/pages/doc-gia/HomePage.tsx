import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMyFines, fetchMyLoans, fetchMyReservations } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Card, KpiCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export function HomePage() {
  const { session } = useAuth()
  const [loanCount, setLoanCount] = useState(0)
  const [reservationCount, setReservationCount] = useState(0)
  const [fineTotal, setFineTotal] = useState(0)

  useEffect(() => {
    const token = session?.token
    if (!token) return
    Promise.all([
      fetchMyLoans(token),
      fetchMyReservations(token),
      fetchMyFines(token),
    ]).then(([loans, reservations, fines]) => {
      setLoanCount(loans.length)
      setReservationCount(reservations.length)
      setFineTotal(fines.reduce((sum, f) => sum + f.amount, 0))
    })
  }, [session?.token])

  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">
        Xin chào, {session?.user.name}
      </h1>
      <p className="mb-6 text-slate-600">
        Bạn đang mượn {loanCount} cuốn sách
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Đang mượn" value={loanCount} />
        <KpiCard label="Đặt trước" value={reservationCount} hintTone="warning" />
        <KpiCard label="Phạt chưa thu" value={formatVnd(fineTotal)} />
      </div>

      <Card className="text-left">
        <p className="mb-4 text-slate-700">Tra cứu sách hoặc xem phiếu mượn của bạn.</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/doc-gia/tim-sach">
            <Button>Tìm sách</Button>
          </Link>
          <Link to="/doc-gia/phieu-muon">
            <Button variant="secondary">Phiếu mượn</Button>
          </Link>
        </div>
      </Card>
    </>
  )
}
