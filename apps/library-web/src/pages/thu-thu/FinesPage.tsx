import { useEffect, useState } from 'react'
import { fetchUnpaidFines, payFine, type FineApi } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { QrPaymentModal } from '../../components/fines/QrPaymentModal'
import { QrCode, CheckCircle2 } from 'lucide-react'

function formatLoanCode(loanId: string) {
  return `PM-${loanId.replaceAll('-', '').slice(-6).toUpperCase()}`
}

export function FinesPage() {
  const { session } = useAuth()
  const [fines, setFines] = useState<FineApi[]>([])
  const [loading, setLoading] = useState(true)
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean
    amount: number
    fineId: string
    loanCode: string
  }>({
    isOpen: false,
    amount: 0,
    fineId: '',
    loanCode: '',
  })

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

  const openQrForFine = (f: FineApi) => {
    const code = formatLoanCode(f.loanId)
    setQrModalData({
      isOpen: true,
      amount: f.amount,
      fineId: f.id,
      loanCode: code,
    })
  }

  return (
    <>
      <PageHeader title="Quản lý Phạt" description="Hiển thị mã QR hoặc xác nhận thu tiền phạt cho độc giả." />
      <Card className="text-left">
        {loading ? (
          <p className="text-sm text-primary-dark/60">Đang tải…</p>
        ) : fines.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
            <p className="font-medium text-slate-700">Hiện không có khoản phạt nào chưa thu.</p>
          </div>
        ) : (
          fines.map((f) => {
            const loanCode = formatLoanCode(f.loanId)
            return (
              <div
                key={f.id}
                className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-violet-50 pb-4 last:mb-0 last:border-0"
              >
                <div>
                  <p className="font-semibold text-slate-900">Phiếu mượn {loanCode}</p>
                  <p className="text-xl font-bold text-amber-700">
                    {f.amount.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="danger">Chưa thu</Badge>
                  <Button
                    variant="secondary"
                    className="text-xs py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                    onClick={() => openQrForFine(f)}
                  >
                    <QrCode className="h-3.5 w-3.5 mr-1" /> Mở mã QR
                  </Button>
                  <Button
                    className="text-xs py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handlePay(f.id)}
                  >
                    Xác nhận đã thu
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </Card>

      {/* QR Payment Modal for Librarian */}
      <QrPaymentModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData({ ...qrModalData, isOpen: false })}
        amount={qrModalData.amount}
        fineId={qrModalData.fineId}
        loanCode={qrModalData.loanCode}
        title={`Thanh toán tiền phạt ${qrModalData.loanCode}`}
        description="Cho Độc giả quét mã bằng ứng dụng Ngân hàng tại quầy phục vụ"
        onPaymentSuccess={async () => {
          if (qrModalData.fineId) {
            await handlePay(qrModalData.fineId)
          }
        }}
      />
    </>
  )
}

