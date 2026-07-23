import { useState } from 'react'
import {
  X,
  Copy,
  Check,
  QrCode,
  Building2,
  CreditCard,
  User,
  DollarSign,
  FileText,
  ShieldCheck,
  Download,
  Sparkles,
} from 'lucide-react'
import { Button } from '../ui/Button'

export interface QrPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  title?: string
  description?: string
  transferNote?: string
  fineId?: string
  loanCode?: string
  onPaymentSuccess?: () => void
}

const POPULAR_BANKS = [
  { id: 'MB', name: 'MB Bank (Quân Đội)', code: '970422' },
  { id: 'VCB', name: 'Vietcombank', code: '970436' },
  { id: 'BIDV', name: 'BIDV', code: '970418' },
  { id: 'TCB', name: 'Techcombank', code: '970407' },
  { id: 'CTG', name: 'VietinBank', code: '970415' },
  { id: 'TPB', name: 'TPBank', code: '970423' },
  { id: 'VPB', name: 'VPBank', code: '970432' },
  { id: 'ACB', name: 'ACB', code: '970416' },
]

export function QrPaymentModal({
  isOpen,
  onClose,
  amount,
  title = 'Thanh toán tiền phạt qua VietQR',
  description = 'Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử bất kỳ để thanh toán nhanh',
  transferNote,
  fineId,
  loanCode,
  onPaymentSuccess,
}: QrPaymentModalProps) {
  const [selectedBank, setSelectedBank] = useState('MB')
  const [accountNo] = useState('0398888888')
  const [accountName] = useState('THU VIEN LMS')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  // Generated transfer note if not provided
  const note =
    transferNote ||
    (fineId
      ? `THANH TOAN PHAT FINE ${fineId.substring(0, 8).toUpperCase()}`
      : loanCode
      ? `THANH TOAN PHAT ${loanCode}`
      : `THANH TOAN PHAT THU VIEN`)

  // VietQR quick link URL template (compact2 for full professional layout)
  const qrUrl = `https://img.vietqr.io/image/${selectedBank}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    note
  )}&accountName=${encodeURIComponent(accountName)}`

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSuccessClick = () => {
    setIsSuccess(true)
    if (onPaymentSuccess) {
      setTimeout(() => {
        onPaymentSuccess()
      }, 1200)
    }
  }

  const handleDownloadQr = () => {
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `VietQR_Thanh_Toan_Phat_${amount}VND.png`
    link.target = '_blank'
    link.click()
  }

  const formatVnd = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm transition-all duration-200 animate-in fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">{title}</h3>
              <p className="text-xs text-purple-100/90">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        {isSuccess ? (
          <div className="py-12 px-6 text-center animate-in zoom-in-95">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
              <ShieldCheck className="h-10 w-10 animate-bounce" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900">Xác nhận chuyển khoản!</h4>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              Cảm ơn bạn đã thực hiện thanh toán tiền phạt. Hệ thống sẽ đối soát thông tin giao dịch và cập nhật trạng thái trong thời gian sớm nhất.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsSuccess(false)
                  onClose()
                }}
              >
                Đóng cửa sổ
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Top Bank Selection Pill Bar */}
            <div className="mb-4 text-left">
              <label className="mb-1.5 flex items-center text-xs font-semibold text-slate-700">
                <Building2 className="mr-1.5 h-3.5 w-3.5 text-purple-600" />
                Chọn Ngân hàng tài khoản nhận:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_BANKS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBank(b.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      selectedBank === b.id
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Grid: Left QR Code, Right Payment Details */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* QR Image Box */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-purple-100 bg-gradient-to-b from-purple-50/50 via-white to-violet-50/30 p-4 shadow-inner">
                <div className="relative group flex items-center justify-center rounded-xl bg-white p-2 shadow-md ring-1 ring-slate-200">
                  <img
                    src={qrUrl}
                    alt="VietQR Code"
                    className="h-52 w-52 object-contain rounded-lg"
                    loading="lazy"
                  />
                  {/* Subtle Scan Overlay Corner Accents */}
                  <div className="pointer-events-none absolute inset-2 rounded-lg border-2 border-dashed border-purple-400/40 opacity-75" />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <Sparkles className="mr-1 h-3 w-3 text-emerald-600" /> Quét tức thì (24/7)
                  </span>
                </div>

                <button
                  onClick={handleDownloadQr}
                  className="mt-3 flex items-center text-xs text-purple-700 font-medium hover:text-purple-900 transition"
                >
                  <Download className="mr-1 h-3.5 w-3.5" /> Tải hình mã QR
                </button>
              </div>

              {/* Payment Details Box */}
              <div className="space-y-3 text-left">
                {/* Amount Box */}
                <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3 border border-amber-200/80">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-xs font-semibold text-amber-900">
                      <DollarSign className="mr-1 h-4 w-4 text-amber-600" /> Số tiền thanh toán
                    </span>
                    <button
                      onClick={() => handleCopy(amount.toString(), 'amount')}
                      className="text-xs font-medium text-amber-800 hover:text-amber-950 flex items-center gap-1 bg-amber-100/80 px-2 py-0.5 rounded transition"
                    >
                      {copiedField === 'amount' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Chép số tiền
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-amber-700">
                    {formatVnd(amount)}
                  </div>
                </div>

                {/* Account Number Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-xs font-medium text-slate-500">
                      <CreditCard className="mr-1 h-3.5 w-3.5 text-purple-600" /> Số tài khoản
                    </span>
                    <button
                      onClick={() => handleCopy(accountNo, 'accountNo')}
                      className="text-xs font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded transition"
                    >
                      {copiedField === 'accountNo' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Sao chép STK
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-slate-900">
                    {accountNo}
                  </div>
                </div>

                {/* Account Holder Name Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <span className="flex items-center text-xs font-medium text-slate-500">
                    <User className="mr-1 h-3.5 w-3.5 text-purple-600" /> Chủ tài khoản
                  </span>
                  <div className="mt-1 text-sm font-bold text-slate-900 uppercase">
                    {accountName}
                  </div>
                </div>

                {/* Transfer Content Note Box */}
                <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-xs font-semibold text-purple-900">
                      <FileText className="mr-1 h-3.5 w-3.5 text-purple-600" /> Nội dung chuyển khoản
                    </span>
                    <button
                      onClick={() => handleCopy(note, 'note')}
                      className="text-xs font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-purple-100 px-2 py-0.5 rounded transition"
                    >
                      {copiedField === 'note' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Sao chép
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-1 font-mono text-xs font-bold text-purple-950 bg-white/80 p-1.5 rounded border border-purple-200/60 break-all select-all">
                    {note}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Step Guide */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-600 text-left">
              <div className="font-semibold text-slate-800 mb-1 flex items-center">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 mr-1" /> Các bước thực hiện:
              </div>
              <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
                <li>Mở ứng dụng Ngân hàng bất kỳ trên điện thoại.</li>
                <li>Chọn tính năng <strong>"Quét mã QR"</strong> và hướng camera vào mã ở trên.</li>
                <li>Kiểm tra số tiền ({formatVnd(amount)}) & bấm <strong>Xác nhận</strong> chuyển khoản.</li>
              </ol>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="secondary" className="w-full sm:w-auto text-xs" onClick={onClose}>
                Đóng
              </Button>
              <Button
                className="w-full sm:w-auto text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                onClick={handleSuccessClick}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" /> Tôi đã chuyển khoản thành công
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
