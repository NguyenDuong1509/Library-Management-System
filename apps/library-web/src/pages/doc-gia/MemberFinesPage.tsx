import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchMyFines,
  fetchMyLoans,
  fetchMyLoanHistory,
  type FineApi,
  type ActiveLoanApi,
  type HistoryLoanApi,
  parseListResponse,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Card, KpiCard } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { QrPaymentModal } from '../../components/fines/QrPaymentModal'
import {
  AlertTriangle,
  CheckCircle2,
  Receipt,
  BookOpen,
  RefreshCw,
  CreditCard,
  QrCode,
  Sparkles,
} from 'lucide-react'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function MemberFinesPage() {
  const { session } = useAuth()
  const [fines, setFines] = useState<FineApi[]>([])
  const [activeLoans, setActiveLoans] = useState<ActiveLoanApi[]>([])
  const [historyLoans, setHistoryLoans] = useState<HistoryLoanApi[]>([])
  const [loading, setLoading] = useState(true)

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean
    amount: number
    fineId?: string
    title?: string
    description?: string
    transferNote?: string
  }>({
    isOpen: false,
    amount: 0,
  })

  const loadFinesData = () => {
    const token = session?.token
    if (!token) return
    setLoading(true)

    Promise.all([
      fetchMyFines(token),
      fetchMyLoans(token).catch(() => []),
      fetchMyLoanHistory(token, 0, 50).catch(() => []),
    ])
      .then(([finesData, loansData, historyData]) => {
        setFines(finesData)
        setActiveLoans(loansData)
        setHistoryLoans(parseListResponse(historyData as any))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFinesData()
  }, [session?.token])

  const unpaidFines = fines.filter((f) => f.status === 'UNPAID')
  const paidFines = fines.filter((f) => f.status === 'PAID')
  const unpaidTotal = unpaidFines.reduce((sum, f) => sum + f.amount, 0)

  // Map loan details to fine
  function getLoanInfo(loanId: string) {
    const activeMatch = activeLoans.find((l) => l.loanId === loanId)
    if (activeMatch) {
      return {
        bookTitle: activeMatch.bookTitle,
        copyCode: activeMatch.copyCode,
        dueAt: activeMatch.dueAt,
      }
    }
    const historyMatch = historyLoans.find((l) => l.loanId === loanId)
    if (historyMatch) {
      return {
        bookTitle: historyMatch.bookTitle,
        copyCode: historyMatch.copyCode,
        dueAt: historyMatch.dueAt,
      }
    }
    return null
  }

  const openQrForSingleFine = (fine: FineApi) => {
    const loanInfo = getLoanInfo(fine.loanId)
    const bookTitleStr = loanInfo?.bookTitle ? ` (${loanInfo.bookTitle})` : ''
    setQrModalData({
      isOpen: true,
      amount: fine.amount,
      fineId: fine.id,
      title: `Thanh toán khoản phạt${bookTitleStr}`,
      description: `Quét mã VietQR để thanh toán khoản phạt ${formatVnd(fine.amount)}`,
      transferNote: `THANH TOAN PHAT FINE ${fine.id.replaceAll('-', '').slice(0, 8).toUpperCase()}`,
    })
  }

  const openQrForAllFines = () => {
    if (unpaidTotal <= 0) return
    setQrModalData({
      isOpen: true,
      amount: unpaidTotal,
      title: `Thanh toán tất cả ${unpaidFines.length} khoản phạt`,
      description: `Quét mã VietQR để thanh toán tổng số tiền phạt ${formatVnd(unpaidTotal)}`,
      transferNote: `THANH TOAN TAT CA ${unpaidFines.length} KHOAN PHAT THU VIEN`,
    })
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-left">
        <div>
          <PageHeader
            title="Phiếu phạt của tôi"
            description="Quản lý thông tin tiền phạt phát sinh do mượn sách quá hạn hoặc làm hỏng/mất sách."
          />
        </div>
        <div className="flex items-center gap-2">
          {unpaidTotal > 0 && (
            <Button
              className="text-xs py-1.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md hover:from-violet-700 hover:to-indigo-700"
              onClick={openQrForAllFines}
            >
              <QrCode className="h-3.5 w-3.5 mr-1" /> Thanh toán tất cả bằng QR
            </Button>
          )}
          <Button variant="secondary" className="text-xs py-1.5" onClick={loadFinesData}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Tải lại dữ liệu
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3 text-left">
        <KpiCard label="Cần thanh toán" value={formatVnd(unpaidTotal)} hintTone={unpaidTotal > 0 ? 'warning' : 'neutral'} />
        <KpiCard label="Số khoản phạt chưa thu" value={unpaidFines.length} />
        <KpiCard label="Đã thanh toán trước đây" value={paidFines.length} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Đang tải dữ liệu tiền phạt...</div>
      ) : fines.length === 0 ? (
        <Card className="py-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h3 className="text-base font-semibold text-slate-900">Không có khoản phạt nào!</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Chúc mừng! Bạn không có khoản phạt nào cần thanh toán. Hãy tiếp tục duy trì việc trả sách đúng hạn nhé.
          </p>
          <Link to="/doc-gia/phieu-muon" className="mt-5 inline-block">
            <Button variant="secondary" className="text-xs">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Xem sách đang mượn
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4 text-left">
          {fines.map((f) => {
            const isUnpaid = f.status === 'UNPAID'
            const loanInfo = getLoanInfo(f.loanId)

            return (
              <Card
                key={f.id}
                className={`relative transition border ${
                  isUnpaid
                    ? 'border-amber-300 bg-gradient-to-r from-amber-50/40 via-white to-white shadow-xs'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isUnpaid ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isUnpaid ? <AlertTriangle className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {loanInfo?.bookTitle ? `Sách: ${loanInfo.bookTitle}` : `Khoản phạt quá hạn`}
                        </h3>
                        {loanInfo?.copyCode && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                            {loanInfo.copyCode}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        Lý do: Phạt quá hạn trả sách {loanInfo?.dueAt && `(Hạn trả: ${formatDate(loanInfo.dueAt)})`}
                      </p>

                      <p className="mt-2 text-xl font-bold text-amber-700">
                        {formatVnd(f.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end shrink-0">
                    <Badge tone={isUnpaid ? 'danger' : 'success'}>
                      {isUnpaid ? 'Chưa thanh toán' : 'Đã thanh toán'}
                    </Badge>

                    {isUnpaid && (
                      <Button
                        className="mt-1 text-xs py-1.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs"
                        onClick={() => openQrForSingleFine(f)}
                      >
                        <QrCode className="h-3.5 w-3.5 mr-1" /> Thanh toán qua QR
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}

          {/* Payment Instructions Box */}
          {unpaidFines.length > 0 && (
            <Card className="mt-6 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50/70 via-white to-purple-50/50 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3 text-left">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      Hướng dẫn thanh toán chuyển khoản qua mã QR
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        <Sparkles className="mr-0.5 h-2.5 w-2.5" /> VietQR Nhanh
                      </span>
                    </h4>
                    <ul className="mt-1.5 list-disc pl-4 text-xs text-slate-600 space-y-1">
                      <li>
                        <strong>Thanh toán trực tiếp bằng mã QR:</strong> Nhấn nút <strong>"Thanh toán qua QR"</strong> ở trên để quét mã thanh toán VietQR tự động nhập số tiền và nội dung chuyển khoản.
                      </li>
                      <li>
                        <strong>Trực tiếp tại quầy:</strong> Nộp tiền mặt hoặc nhờ Thủ thư hiển thị mã QR tại quầy thư viện khi trả/nhận sách.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="shrink-0 text-left">
                  <Button
                    className="w-full sm:w-auto text-xs py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
                    onClick={openQrForAllFines}
                  >
                    <QrCode className="h-4 w-4 mr-1.5" /> Mở mã QR thanh toán tổng ({formatVnd(unpaidTotal)})
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* QR Payment Modal */}
      <QrPaymentModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData({ ...qrModalData, isOpen: false })}
        amount={qrModalData.amount}
        title={qrModalData.title}
        description={qrModalData.description}
        transferNote={qrModalData.transferNote}
        fineId={qrModalData.fineId}
        onPaymentSuccess={() => {
          loadFinesData()
        }}
      />
    </>
  )
}


