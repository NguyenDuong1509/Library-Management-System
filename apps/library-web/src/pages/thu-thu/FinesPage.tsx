import { useEffect, useState } from 'react'
import { fetchUnpaidFines, payFine, type FineApi } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'

export function FinesPage() {
  const { session } = useAuth()
  const [fines, setFines] = useState<FineApi[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    const token = session?.token
    if (!token) return
    setLoading(true)
    fetchUnpaidFines(token)
      .then(setFines)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [session?.token])

  async function handlePay(fineId: string) {
    const token = session?.token
    if (!token) return
    await payFine(token, fineId)
    load()
  }

  return (
    <>
      <PageHeader title="Phạt" description="Danh sách phạt trễ hạn" />
      <Card className="text-left">
        {loading ? (
          <p className="text-sm text-primary-dark/60">Đang tải…</p>
        ) : fines.length === 0 ? (
          <p className="text-sm text-primary-dark/60">Không có phạt chưa thu.</p>
        ) : (
          fines.map((f) => (
            <div
              key={f.id}
              className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-violet-50 pb-4 last:mb-0 last:border-0"
            >
              <div>
                <p className="font-medium">Phiếu mượn {f.loanId.slice(0, 8)}…</p>
                <p className="text-lg font-semibold text-primary-dark">
                  {f.amount.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="danger">Chưa thu</Badge>
                <Button onClick={() => handlePay(f.id)}>Đã thu</Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  )
}
