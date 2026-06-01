import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  checkout,
  lookupCopy,
  lookupMember,
  fetchActiveLoans,
  returnLoan,
  renewLoan,
  type ActiveLoanApi,
  type CopyLookupApi,
  type MemberLookupApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useDebouncedLookup } from '../../hooks/useDebouncedLookup'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'
import { memberQueryFromCardParam } from '../../lib/muonTraPrefill'

export function LoanReturnPage() {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const token = session?.token ?? ''
  const [memberQuery, setMemberQuery] = useState('')
  const [copyQuery, setCopyQuery] = useState('')
  const [activeLoans, setActiveLoans] = useState<ActiveLoanApi[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const memberLookupFn = useCallback(
    (q: string) => lookupMember(token, q),
    [token],
  )
  const copyLookupFn = useCallback(
    (q: string) => lookupCopy(token, q),
    [token],
  )

  const memberLookup = useDebouncedLookup<MemberLookupApi>(memberQuery, memberLookupFn)
  const copyLookup = useDebouncedLookup<CopyLookupApi>(copyQuery, copyLookupFn)

  useEffect(() => {
    const card = memberQueryFromCardParam(searchParams.get('card'))
    if (card) {
      setMemberQuery(card)
    }
  }, [searchParams])

  useEffect(() => {
    if (!token || !memberLookup.result?.id) {
      setActiveLoans([])
      return
    }
    fetchActiveLoans(token, memberLookup.result.id)
      .then(setActiveLoans)
      .catch(() => setActiveLoans([]))
  }, [token, memberLookup.result?.id])

  async function handleCheckout() {
    if (!memberLookup.result || !copyLookup.result) {
      setActionError('Chọn độc giả và bản sao hợp lệ trước.')
      return
    }
    setActionError(null)
    try {
      await checkout(token, memberLookup.result.id, copyLookup.result.id)
      setToast('Mượn sách thành công.')
      const loans = await fetchActiveLoans(token, memberLookup.result.id)
      setActiveLoans(loans)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Mượn thất bại.')
    }
  }

  async function handleReturn(loanId: string) {
    setActionError(null)
    try {
      await returnLoan(token, loanId)
      setToast('Trả sách thành công.')
      if (memberLookup.result) {
        const loans = await fetchActiveLoans(token, memberLookup.result.id)
        setActiveLoans(loans)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Trả thất bại.')
    }
  }

  async function handleRenew(loanId: string) {
    setActionError(null)
    try {
      await renewLoan(token, loanId)
      setToast('Gia hạn thành công.')
      if (memberLookup.result) {
        const loans = await fetchActiveLoans(token, memberLookup.result.id)
        setActiveLoans(loans)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gia hạn thất bại.')
    }
  }

  return (
    <>
      <PageHeader
        title="Mượn / Trả sách"
        description="Quét mã thẻ và mã bản sao để xử lý nhanh"
      />
      {actionError && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {actionError}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="text-left">
          <h2 className="mb-4 font-semibold text-primary-dark">Độc giả</h2>
          <Input
            label="Mã thẻ hoặc email"
            name="member"
            placeholder="TV-2024-001"
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
          />
          {memberLookup.loading && (
            <p className="mt-2 text-sm text-primary-dark/60">Đang tra cứu…</p>
          )}
          {memberLookup.error && (
            <p className="mt-2 text-sm text-red-600">{memberLookup.error}</p>
          )}
          {memberLookup.result && (
            <p className="mt-2 text-sm text-primary-dark/80">
              {memberLookup.result.name} — Đang mượn:{' '}
              {memberLookup.result.activeLoanCount} / {memberLookup.result.maxLoanCount}
            </p>
          )}
        </Card>
        <Card className="text-left">
          <h2 className="mb-4 font-semibold text-primary-dark">Bản sao sách</h2>
          <Input
            label="Mã bản sao"
            name="copy"
            placeholder="BK-XXXXXXXX-1"
            value={copyQuery}
            onChange={(e) => setCopyQuery(e.target.value)}
          />
          {copyLookup.loading && (
            <p className="mt-2 text-sm text-primary-dark/60">Đang tra cứu…</p>
          )}
          {copyLookup.result && (
            <p className="mt-2 text-sm text-emerald-700">
              {copyLookup.result.bookTitle} — {copyLookup.result.status}
            </p>
          )}
        </Card>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={handleCheckout}>Xác nhận mượn</Button>
      </div>
      {activeLoans.length > 0 && (
        <Card className="mt-6 text-left">
          <h2 className="mb-4 font-semibold">Phiếu đang mượn</h2>
          <ul className="space-y-3">
            {activeLoans.map((loan) => (
              <li
                key={loan.loanId}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-50 pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{loan.bookTitle}</p>
                  <p className="text-xs font-mono text-primary-dark/60">{loan.copyCode}</p>
                  <p className="text-sm text-primary-dark/70">
                    Hạn: {new Date(loan.dueAt).toLocaleDateString('vi-VN')}
                    {loan.renewalCount != null && loan.renewalCount > 0 && (
                      <span className="ml-2 text-xs">· Đã gia hạn {loan.renewalCount} lần</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => handleRenew(loan.loanId)}>
                    Gia hạn
                  </Button>
                  <Button variant="secondary" onClick={() => handleReturn(loan.loanId)}>
                    Trả sách
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {toast && <Toast message={toast} />}
    </>
  )
}
