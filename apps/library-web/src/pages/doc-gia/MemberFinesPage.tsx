import { useEffect, useState } from 'react'
import { fetchMyFines, type FineApi } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'

export function MemberFinesPage() {
  const { session } = useAuth()
  const [fines, setFines] = useState<FineApi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = session?.token
    if (!token) return
    fetchMyFines(token)
      .then(setFines)
      .finally(() => setLoading(false))
  }, [session?.token])

  return (
    <>
      <PageHeader title="Phạt của tôi" />
      {loading ? (
        <p className="text-sm text-primary-dark/60">Đang tải…</p>
      ) : fines.length === 0 ? (
        <Card className="text-left text-slate-600">
          Bạn không có khoản phạt chưa thanh toán.
        </Card>
      ) : (
        fines.map((f) => (
          <Card key={f.id} className="mb-4 text-left">
            <p className="text-lg font-semibold">
              {f.amount.toLocaleString('vi-VN')} ₫
            </p>
            <Badge tone="danger" className="mt-2">
              Chưa thanh toán
            </Badge>
          </Card>
        ))
      )}
    </>
  )
}
