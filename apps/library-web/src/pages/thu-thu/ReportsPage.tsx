import { useEffect, useState } from 'react'
import {
  downloadReportCsv,
  type TopBookApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/ui/Button'
import { Card, KpiCard } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function toIsoDate(dateStr: string) {
  if (!dateStr) return undefined
  return new Date(dateStr).toISOString()
}

export function ReportsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const [overdueCount, setOverdueCount] = useState(0)
  const [paidTotal, setPaidTotal] = useState(0)
  const [topBooks, setTopBooks] = useState<TopBookApi[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function loadReports() {
    if (!token) return
    const fromIso = toIsoDate(from)
    const toIso = toIsoDate(to)
    const qs = new URLSearchParams()
    if (fromIso) qs.set('from', fromIso)
    if (toIso) qs.set('to', toIso)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''

    setLoading(true)
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/reports/overdue${suffix}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/reports/fines${suffix}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/reports/top-books?limit=5${suffix ? `&${qs.toString()}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } },
      ).then((r) => r.json()),
    ])
      .then(([overdue, fines, top]) => {
        setOverdueCount(overdue.length)
        setPaidTotal(fines.paidTotal)
        setTopBooks(top)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReports()
  }, [token])

  async function handleExport(kind: 'overdue' | 'top-books' | 'fines') {
    const qs = new URLSearchParams()
    const fromIso = toIsoDate(from)
    const toIso = toIsoDate(to)
    if (fromIso) qs.set('from', fromIso)
    if (toIso) qs.set('to', toIso)
    if (kind === 'top-books') qs.set('limit', '10')
    const query = qs.toString() ? `?${qs.toString()}` : ''
    await downloadReportCsv(token, `/api/reports/${kind}/export${query}`, `${kind}.csv`)
  }

  return (
    <>
      <PageHeader title="Báo cáo" description="Tổng hợp vận hành theo kỳ" />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input label="Từ ngày" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Đến ngày" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <div className="flex items-end">
          <Button onClick={loadReports}>Lọc</Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Phiếu quá hạn" value={loading ? '…' : overdueCount} />
        <KpiCard
          label="Top mượn"
          value={loading ? '…' : (topBooks[0]?.title ?? '—')}
        />
        <KpiCard
          label="Phạt đã thu"
          value={loading ? '…' : formatVnd(paidTotal)}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => handleExport('overdue')}>
          Tải CSV quá hạn
        </Button>
        <Button variant="secondary" onClick={() => handleExport('top-books')}>
          Tải CSV top sách
        </Button>
        <Button variant="secondary" onClick={() => handleExport('fines')}>
          Tải CSV phạt
        </Button>
      </div>
      <Card className="mt-6 overflow-x-auto p-0 text-left">
        <table className="w-full text-sm">
          <thead className="bg-violet-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Sách</th>
              <th className="px-4 py-3 text-left font-semibold">Lượt mượn</th>
            </tr>
          </thead>
          <tbody>
            {topBooks.map((b) => (
              <tr key={b.bookId} className="border-t border-violet-50">
                <td className="px-4 py-3">{b.title}</td>
                <td className="px-4 py-3">{b.loanCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
