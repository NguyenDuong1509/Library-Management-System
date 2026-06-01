import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addBookCopies,
  fetchBook,
  fetchBookBySlug,
  fetchBookCopies,
  setBookActive,
  updateBook,
  updateCopyStatus,
  type BookCopyApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'

const COPY_STATUSES = ['AVAILABLE', 'ON_LOAN', 'RESERVED', 'LOST', 'MAINTENANCE'] as const
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function BookDetailPage() {
  const { slug: routeParam } = useParams<{ slug: string }>()
  const { session } = useAuth()
  const token = session?.token ?? ''
  const [book, setBook] = useState<Awaited<ReturnType<typeof fetchBook>> | null>(null)
  const [copies, setCopies] = useState<BookCopyApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [copyCount, setCopyCount] = useState('1')
  const [editForm, setEditForm] = useState({
    title: '',
    isbn: '',
    authors: '',
    category: '',
  })

  async function loadBookDetail() {
    if (!token || !routeParam) return
    if (UUID_RE.test(routeParam)) {
      return fetchBook(token, routeParam)
    }
    return fetchBookBySlug(token, routeParam)
  }

  async function load() {
    if (!token || !routeParam) return
    setLoading(true)
    try {
      const b = await loadBookDetail()
      if (!b) return
      const c = await fetchBookCopies(token, b.id)
      setBook(b)
      setCopies(c)
      setEditForm({
        title: b.title,
        isbn: b.isbn ?? '',
        authors: b.authors,
        category: b.category,
      })
    } catch {
      setError('Không tải được chi tiết sách.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, routeParam])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !book) return
    try {
      const updated = await updateBook(token, book.id, {
        title: editForm.title,
        isbn: editForm.isbn || null,
        authors: editForm.authors,
        category: editForm.category,
      })
      setBook(updated)
      setToast('Đã cập nhật sách.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại.')
    }
  }

  async function handleToggleActive() {
    if (!token || !book) return
    const updated = await setBookActive(token, book.id, !book.isActive)
    setBook(updated)
    setToast(book.isActive ? 'Đã ẩn sách.' : 'Đã kích hoạt sách.')
  }

  async function handleAddCopies() {
    if (!token || !book) return
    await addBookCopies(token, book.id, Number(copyCount) || 1)
    setToast('Đã thêm bản sao.')
    await load()
  }

  async function handleCopyStatus(copyId: string, status: string) {
    if (!token) return
    try {
      await updateCopyStatus(token, copyId, status)
      setToast('Đã cập nhật trạng thái bản sao.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại.')
    }
  }

  if (loading) {
    return <p className="text-sm text-primary-dark/60">Đang tải…</p>
  }

  if (!book) {
    return <p className="text-sm text-red-600">{error ?? 'Không tìm thấy sách.'}</p>
  }

  return (
    <>
      <PageHeader
        title={book.title}
        description={`${book.authors} · ${book.category}`}
        action={
          <Link to="/thu-thu/sach" className="text-sm text-primary hover:underline">
            ← Danh mục
          </Link>
        }
      />
      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="text-left">
          <h2 className="mb-4 font-semibold">Thông tin đầu sách</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <Input
              label="Tiêu đề"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
            <Input
              label="ISBN"
              value={editForm.isbn}
              onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
            />
            <Input
              label="Tác giả"
              value={editForm.authors}
              onChange={(e) => setEditForm({ ...editForm, authors: e.target.value })}
              required
            />
            <Input
              label="Thể loại"
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              required
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit">Lưu</Button>
              <Button type="button" variant="secondary" onClick={handleToggleActive}>
                {book.isActive ? 'Ẩn sách' : 'Kích hoạt'}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            Còn {book.availableCount} / {book.totalCopies} bản khả dụng
          </p>
        </Card>

        <Card className="text-left">
          <h2 className="mb-4 font-semibold">Thêm bản sao</h2>
          <div className="flex gap-2">
            <Input
              label="Số lượng"
              type="number"
              min={1}
              value={copyCount}
              onChange={(e) => setCopyCount(e.target.value)}
            />
            <div className="flex items-end">
              <Button type="button" onClick={handleAddCopies}>
                Thêm
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-x-auto p-0 text-left">
        <h2 className="border-b border-violet-50 px-4 py-3 font-semibold">Bản sao</h2>
        <table className="w-full text-sm">
          <thead className="bg-violet-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Mã</th>
              <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-left font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {copies.map((c) => (
              <tr key={c.id} className="border-t border-violet-50">
                <td className="px-4 py-3 font-mono">{c.copyCode}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.status === 'AVAILABLE' ? 'success' : 'warning'}>
                    {c.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {c.status !== 'ON_LOAN' ? (
                    <select
                      className="rounded border border-violet-100 px-2 py-1 text-sm"
                      value={c.status}
                      onChange={(e) => handleCopyStatus(c.id, e.target.value)}
                    >
                      {COPY_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-slate-500">Đang mượn</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {toast && <Toast message={toast} />}
    </>
  )
}
