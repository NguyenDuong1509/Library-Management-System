import type { UserRole } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers: extraHeaders, ...init } = options
  const headers = new Headers(extraHeaders)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    const body = await parseJson<{ message?: string }>(res)
    throw new ApiError(body.message ?? res.statusText, res.status)
  }

  return parseJson<T>(res)
}

export interface LoginApiResponse {
  token: string
  userId: string
  email: string
  name: string
  role: UserRole
}

export function loginApi(email: string, password: string) {
  return apiFetch<LoginApiResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export interface BookApiResponse {
  id: string
  slug: string
  title: string
  isbn: string | null
  authors: string
  category: string
  isActive?: boolean
  availableCount?: number
  totalCopies?: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export function isPageResponse<T>(value: unknown): value is PageResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'content' in value &&
    Array.isArray((value as PageResponse<T>).content)
  )
}

export function parseListResponse<T>(value: T[] | PageResponse<T>): T[] {
  return isPageResponse<T>(value) ? value.content : value
}

export type BookWithAvailability = BookApiResponse & {
  availableCount: number
  totalCopies: number
}

export interface CreateBookPayload {
  title: string
  isbn?: string | null
  authors: string
  category: string
  copyCount: number
}

export function fetchBooks(
  token: string,
  options?: { activeOnly?: boolean; q?: string; category?: string; page?: number; size?: number },
) {
  const params = new URLSearchParams()
  if (options?.activeOnly) params.set('activeOnly', 'true')
  if (options?.q) params.set('q', options.q)
  if (options?.category) params.set('category', options.category)
  if (options?.page != null) params.set('page', String(options.page))
  if (options?.size != null) params.set('size', String(options.size))
  const query = params.toString() ? `?${params.toString()}` : ''
  if (options?.page != null) {
    return apiFetch<PageResponse<BookApiResponse>>(`/api/books${query}`, { token })
  }
  return apiFetch<BookApiResponse[]>(`/api/books${query}`, { token })
}

export function fetchBook(token: string, bookId: string) {
  return apiFetch<BookWithAvailability>(`/api/books/${bookId}`, { token })
}

export function fetchBookBySlug(token: string, slug: string) {
  return apiFetch<BookWithAvailability>(`/api/books/by-slug/${encodeURIComponent(slug)}`, {
    token,
  })
}

export interface UpdateBookPayload {
  title: string
  isbn?: string | null
  authors: string
  category: string
}

export function updateBook(token: string, bookId: string, payload: UpdateBookPayload) {
  return apiFetch<BookWithAvailability>(`/api/books/${bookId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })
}

export function setBookActive(token: string, bookId: string, isActive: boolean) {
  return apiFetch<BookWithAvailability>(`/api/books/${bookId}/active`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ isActive }),
  })
}

export function addBookCopies(token: string, bookId: string, count: number) {
  return apiFetch<BookWithAvailability>(`/api/books/${bookId}/copies`, {
    method: 'POST',
    token,
    body: JSON.stringify({ count }),
  })
}

export function createBook(token: string, payload: CreateBookPayload) {
  return apiFetch<BookApiResponse>('/api/books', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export interface LibraryConfigApi {
  maxLoanCount: number
  loanDaysDefault: number
  maxRenewals: number
  finePerDay: number
  reminderDaysBefore: number
}

export function fetchAdminConfig(token: string) {
  return apiFetch<LibraryConfigApi>('/api/admin/config', { token })
}

export function updateAdminConfig(token: string, payload: LibraryConfigApi) {
  return apiFetch<LibraryConfigApi>('/api/admin/config', {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })
}

export interface MemberLookupApi {
  id: string
  libraryCardId: string
  name: string
  status: string
  activeLoanCount: number
  maxLoanCount: number
}

export function lookupMember(token: string, q: string) {
  return apiFetch<MemberLookupApi>(
    `/api/members/lookup?q=${encodeURIComponent(q)}`,
    { token },
  )
}

export interface CopyLookupApi {
  id: string
  copyCode: string
  status: string
  bookTitle: string
  bookId: string
}

export function lookupCopy(token: string, copyCode: string) {
  return apiFetch<CopyLookupApi>(
    `/api/book-copies/lookup?copyCode=${encodeURIComponent(copyCode)}`,
    { token },
  )
}

export interface ActiveLoanApi {
  loanId: string
  copyCode: string
  bookTitle: string
  dueAt: string
  renewalCount?: number
}

export function fetchActiveLoans(token: string, memberId: string) {
  return apiFetch<ActiveLoanApi[]>(
    `/api/loans/active?memberId=${encodeURIComponent(memberId)}`,
    { token },
  )
}

export function fetchMyLoans(token: string) {
  return apiFetch<ActiveLoanApi[]>('/api/loans/me', { token })
}

export interface MemberApi {
  id: string
  libraryCardId: string
  name: string
  email: string
  status: string
}

export function fetchMembers(token: string) {
  return apiFetch<MemberApi[]>('/api/members', { token })
}

export interface RegisterMemberPayload {
  email: string
  password: string
  name: string
  phone?: string
}

export function registerMember(token: string, payload: RegisterMemberPayload) {
  return apiFetch<MemberApi>('/api/members/register', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function updateMemberStatus(
  token: string,
  memberId: string,
  status: 'ACTIVE' | 'SUSPENDED',
) {
  return apiFetch<MemberApi>(`/api/members/${memberId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  })
}

export interface LoanApi {
  id: string
  memberId: string
  bookCopyId: string
  status: string
  checkoutAt: string
  dueAt: string
  returnedAt: string | null
  renewalCount: number
}

export function checkout(token: string, memberId: string, copyId: string) {
  return apiFetch<LoanApi>('/api/circulation/checkout', {
    method: 'POST',
    token,
    body: JSON.stringify({ memberId, copyId }),
  })
}

export function returnLoan(token: string, loanId: string) {
  return apiFetch<LoanApi>(`/api/circulation/${loanId}/return`, {
    method: 'POST',
    token,
  })
}

export function renewLoan(token: string, loanId: string) {
  return apiFetch<LoanApi>(`/api/circulation/${loanId}/renew`, {
    method: 'POST',
    token,
  })
}

export interface FineApi {
  id: string
  loanId: string
  amount: number
  status: string
}

export function fetchUnpaidFines(token: string) {
  return apiFetch<FineApi[]>('/api/fines/unpaid', { token })
}

export function fetchMyFines(token: string) {
  return apiFetch<FineApi[]>('/api/fines/me', { token })
}

export function payFine(token: string, fineId: string) {
  return apiFetch<FineApi>(`/api/fines/${fineId}/pay`, {
    method: 'POST',
    token,
  })
}

export interface OverdueLoanApi {
  loanId: string
  libraryCardId: string
  copyCode: string
  dueAt: string
}

export function fetchOverdueLoans(token: string) {
  return apiFetch<OverdueLoanApi[]>('/api/reports/overdue', { token })
}

export interface FineSummaryApi {
  unpaidTotal: number
  paidTotal: number
  grandTotal: number
}

export function fetchFineSummary(token: string) {
  return apiFetch<FineSummaryApi>('/api/reports/fines', { token })
}

export interface DashboardKpisApi {
  checkoutsToday: number
  pendingReservations: number
  overdueCount: number
  unpaidFineTotal: number
}

export function fetchDashboardKpis(token: string) {
  return apiFetch<DashboardKpisApi>('/api/reports/dashboard-kpis', { token })
}

export interface TopBookApi {
  bookId: string
  title: string
  loanCount: number
}

export function fetchTopBooks(token: string, limit = 10) {
  return apiFetch<TopBookApi[]>(`/api/reports/top-books?limit=${limit}`, {
    token,
  })
}

export interface ReservationApi {
  id: string
  memberId: string
  bookId: string
  status: string
  queuePosition: number
  memberName?: string
  libraryCardId?: string
  bookTitle?: string
}

export function fetchReservationsByBook(token: string, bookId: string) {
  return apiFetch<ReservationApi[]>(`/api/reservations/book/${bookId}`, { token })
}

export function fetchMyReservations(token: string) {
  return apiFetch<ReservationApi[]>('/api/reservations/me', { token })
}

export function createReservation(token: string, memberId: string, bookId: string) {
  return apiFetch<ReservationApi>('/api/reservations', {
    method: 'POST',
    token,
    body: JSON.stringify({ memberId, bookId }),
  })
}

export function createMyReservation(token: string, bookId: string) {
  return apiFetch<ReservationApi>('/api/reservations/me', {
    method: 'POST',
    token,
    body: JSON.stringify({ bookId }),
  })
}

export function cancelReservation(token: string, reservationId: string) {
  return apiFetch<ReservationApi>(`/api/reservations/${reservationId}/cancel`, {
    method: 'PATCH',
    token,
  })
}

export interface SearchResultApi {
  books: { id: string; slug: string; title: string; authors: string; category: string }[]
  members: { id: string; libraryCardId: string; name: string; email: string }[]
  copies: {
    id: string
    copyCode: string
    status: string
    bookId: string
    bookSlug: string
    bookTitle: string
  }[]
}

export function searchGlobal(token: string, q: string, limit = 10) {
  return apiFetch<SearchResultApi>(
    `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    { token },
  )
}

export interface BookCopyApi {
  id: string
  copyCode: string
  status: string
  bookId: string
  bookTitle: string
}

export function fetchBookCopies(token: string, bookId: string) {
  return apiFetch<BookCopyApi[]>(`/api/books/${bookId}/copies`, { token })
}

export function updateCopyStatus(token: string, copyId: string, status: string) {
  return apiFetch<BookCopyApi>(`/api/book-copies/${copyId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  })
}

export function fetchOpenReservations(token: string) {
  return apiFetch<ReservationApi[]>('/api/reservations', { token })
}

export interface FulfillResultApi {
  reservationId: string
  reservationStatus: string
  loanId: string
  copyCode: string
  bookTitle: string
}

export function fulfillReservation(token: string, reservationId: string, copyId: string) {
  return apiFetch<FulfillResultApi>(`/api/reservations/${reservationId}/fulfill`, {
    method: 'POST',
    token,
    body: JSON.stringify({ copyId }),
  })
}

export interface NotificationApi {
  id: string
  memberId: string | null
  loanId: string | null
  type: string
  sentOn: string
  createdAt: string
}

export function fetchMyNotifications(token: string, page = 0, size = 20) {
  return apiFetch<PageResponse<NotificationApi>>(
    `/api/notifications/me?page=${page}&size=${size}`,
    { token },
  )
}

export function fetchStaffNotifications(token: string, page = 0, size = 20) {
  return apiFetch<PageResponse<NotificationApi>>(
    `/api/notifications?page=${page}&size=${size}`,
    { token },
  )
}

export interface HistoryLoanApi {
  loanId: string
  copyCode: string
  bookTitle: string
  checkoutAt: string
  dueAt: string
  returnedAt: string
  renewalCount: number
}

export function fetchMyLoanHistory(token: string, page = 0, size = 20) {
  return apiFetch<PageResponse<HistoryLoanApi>>(
    `/api/loans/me/history?page=${page}&size=${size}`,
    { token },
  )
}

export function fetchMembersPaged(token: string, page = 0, size = 20, q?: string) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (q) params.set('q', q)
  return apiFetch<PageResponse<MemberApi>>(`/api/members?${params.toString()}`, { token })
}

const API_URL_EXPORT = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export function reportExportUrl(
  kind: 'overdue' | 'top-books' | 'fines',
  token: string,
  from?: string,
  to?: string,
  limit = 10,
) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  if (kind === 'top-books') params.set('limit', String(limit))
  const qs = params.toString() ? `?${params.toString()}` : ''
  return `${API_URL_EXPORT}/api/reports/${kind}/export${qs}&token=${encodeURIComponent(token)}`
}

export async function downloadReportCsv(
  token: string,
  path: string,
  filename: string,
) {
  const res = await fetch(`${API_URL_EXPORT}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new ApiError(res.statusText, res.status)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export interface AdminUserApi {
  id: string
  email: string
  name: string
  role: string
  active: boolean
}

export function fetchAdminUsers(token: string) {
  return apiFetch<AdminUserApi[]>('/api/admin/users', { token })
}

export function createAdminUser(
  token: string,
  payload: { email: string; password: string; name: string; role: 'ADMIN' | 'LIBRARIAN' },
) {
  return apiFetch<AdminUserApi>('/api/admin/users', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function deactivateAdminUser(token: string, userId: string) {
  return apiFetch<AdminUserApi>(`/api/admin/users/${userId}/deactivate`, {
    method: 'PATCH',
    token,
  })
}

export function updateAdminUserRole(token: string, userId: string, role: 'ADMIN' | 'LIBRARIAN') {
  return apiFetch<AdminUserApi>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ role }),
  })
}

export interface AuditLogApi {
  id: string
  actorUserId: string | null
  action: string
  targetType: string
  targetId: string | null
  detail: string | null
  createdAt: string
}

export function fetchAuditLogs(token: string, page = 0, size = 20) {
  return apiFetch<{
    content: AuditLogApi[]
    totalElements: number
    totalPages: number
    page: number
    size: number
  }>(`/api/admin/audit-logs?page=${page}&size=${size}`, { token })
}
