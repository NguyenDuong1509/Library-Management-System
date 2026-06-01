import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  addBookCopies,
  createBook,
  fetchBooks,
  parseListResponse,
  setBookActive,
  updateBook,
  type BookApiResponse,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'
import { Badge } from '../../components/ui/Badge'

export function BooksPage() {
  const { session } = useAuth()
  const [books, setBooks] = useState<BookApiResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copyBookId, setCopyBookId] = useState<string | null>(null)
  const [copyCount, setCopyCount] = useState('1')
  const [form, setForm] = useState({
    title: '',
    isbn: '',
    authors: '',
    category: '',
    copyCount: '1',
  })
  const [editForm, setEditForm] = useState({
    title: '',
    isbn: '',
    authors: '',
    category: '',
  })

  function loadBooks() {
    const token = session?.token
    if (!token) return
    setLoading(true)
    fetchBooks(token)
      .then((data) => setBooks(parseListResponse(data)))
      .catch(() => setError('Không tải được danh sách sách từ API.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBooks()
  }, [session?.token])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const token = session?.token
    if (!token) return
    try {
      await createBook(token, {
        title: form.title,
        isbn: form.isbn || null,
        authors: form.authors,
        category: form.category,
        copyCount: Number(form.copyCount) || 1,
      })
      setShowForm(false)
      setToast('Đã thêm sách.')
      setForm({ title: '', isbn: '', authors: '', category: '', copyCount: '1' })
      loadBooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thêm sách thất bại.')
    }
  }

  function startEdit(book: BookApiResponse) {
    setEditingId(book.id)
    setEditForm({
      title: book.title,
      isbn: book.isbn ?? '',
      authors: book.authors,
      category: book.category,
    })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    const token = session?.token
    if (!token || !editingId) return
    try {
      await updateBook(token, editingId, {
        title: editForm.title,
        isbn: editForm.isbn || null,
        authors: editForm.authors,
        category: editForm.category,
      })
      setEditingId(null)
      setToast('Đã cập nhật sách.')
      loadBooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại.')
    }
  }

  async function handleToggleActive(book: BookApiResponse) {
    const token = session?.token
    if (!token) return
    try {
      await setBookActive(token, book.id, !(book.isActive ?? true))
      setToast(book.isActive === false ? 'Đã kích hoạt sách.' : 'Đã ngừng sử dụng sách.')
      loadBooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thay đổi trạng thái thất bại.')
    }
  }

  async function handleAddCopies(e: React.FormEvent) {
    e.preventDefault()
    const token = session?.token
    if (!token || !copyBookId) return
    try {
      await addBookCopies(token, copyBookId, Number(copyCount) || 1)
      setCopyBookId(null)
      setCopyCount('1')
      setToast('Đã thêm bản sao.')
      loadBooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thêm bản sao thất bại.')
    }
  }

  return (
    <>
      <PageHeader
        title="Danh mục sách"
        description="Dữ liệu từ GET /api/books"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Đóng form' : 'Thêm sách'}
          </Button>
        }
      />

      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}

      {showForm && (
        <Card className="mb-6 text-left">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tiêu đề"
              name="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              label="ISBN"
              name="isbn"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            />
            <Input
              label="Tác giả"
              name="authors"
              value={form.authors}
              onChange={(e) => setForm({ ...form, authors: e.target.value })}
              required
            />
            <Input
              label="Thể loại"
              name="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
            <Input
              label="Số bản sao"
              name="copyCount"
              type="number"
              min={1}
              value={form.copyCount}
              onChange={(e) => setForm({ ...form, copyCount: e.target.value })}
              required
            />
            <div className="flex items-end">
              <Button type="submit">Lưu sách</Button>
            </div>
          </form>
        </Card>
      )}

      {editingId && (
        <Card className="mb-6 text-left">
          <h2 className="mb-4 font-semibold">Sửa sách</h2>
          <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tiêu đề"
              name="editTitle"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
            <Input
              label="ISBN"
              name="editIsbn"
              value={editForm.isbn}
              onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
            />
            <Input
              label="Tác giả"
              name="editAuthors"
              value={editForm.authors}
              onChange={(e) => setEditForm({ ...editForm, authors: e.target.value })}
              required
            />
            <Input
              label="Thể loại"
              name="editCategory"
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              required
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Lưu thay đổi</Button>
              <Button variant="secondary" type="button" onClick={() => setEditingId(null)}>
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {copyBookId && (
        <Card className="mb-6 text-left">
          <h2 className="mb-4 font-semibold">Thêm bản sao</h2>
          <form onSubmit={handleAddCopies} className="flex flex-wrap items-end gap-4">
            <Input
              label="Số bản sao mới"
              name="addCopies"
              type="number"
              min={1}
              value={copyCount}
              onChange={(e) => setCopyCount(e.target.value)}
              required
            />
            <Button type="submit">Thêm</Button>
            <Button variant="secondary" type="button" onClick={() => setCopyBookId(null)}>
              Hủy
            </Button>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0 text-left">
        {loading ? (
          <p className="p-6 text-sm text-primary-dark/60">Đang tải…</p>
        ) : books.length === 0 ? (
          <p className="p-6 text-sm text-primary-dark/60">
            Chưa có sách. Thêm qua form phía trên.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-violet-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Tiêu đề</th>
                <th className="px-4 py-3 text-left font-semibold">ISBN</th>
                <th className="px-4 py-3 text-left font-semibold">Tác giả</th>
                <th className="px-4 py-3 text-left font-semibold">Thể loại</th>
                <th className="px-4 py-3 text-left font-semibold">Còn / Tổng</th>
                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-violet-50 hover:bg-violet-50/50"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/thu-thu/sach/${b.slug}`} className="text-primary hover:underline">
                      {b.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{b.isbn ?? '—'}</td>
                  <td className="px-4 py-3">{b.authors}</td>
                  <td className="px-4 py-3">{b.category}</td>
                  <td className="px-4 py-3">
                    {b.availableCount ?? '—'} / {b.totalCopies ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={b.isActive === false ? 'warning' : 'success'}>
                      {b.isActive === false ? 'Ngừng' : 'Hoạt động'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => startEdit(b)}>
                        Sửa
                      </Button>
                      <Button variant="secondary" onClick={() => setCopyBookId(b.id)}>
                        + Bản sao
                      </Button>
                      <Button variant="secondary" onClick={() => handleToggleActive(b)}>
                        {b.isActive === false ? 'Kích hoạt' : 'Ngừng dùng'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {toast && <Toast message={toast} />}
    </>
  )
}
