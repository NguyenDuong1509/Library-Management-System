import { useEffect, useState } from 'react'
import {
  fetchMembers,
  registerMember,
  updateMemberStatus,
  type MemberApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'

export function MembersPage() {
  const { session } = useAuth()
  const [members, setMembers] = useState<MemberApi[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  })

  function load() {
    const token = session?.token
    if (!token) return
    setLoading(true)
    fetchMembers(token)
      .then(setMembers)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [session?.token])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const token = session?.token
    if (!token) return
    await registerMember(token, form)
    setShowForm(false)
    setToast('Đã tạo độc giả.')
    setForm({ email: '', password: '', name: '', phone: '' })
    load()
  }

  async function toggleStatus(member: MemberApi) {
    const token = session?.token
    if (!token) return
    const next = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    await updateMemberStatus(token, member.id, next)
    setToast(next === 'SUSPENDED' ? 'Đã khóa thẻ.' : 'Đã mở thẻ.')
    load()
  }

  return (
    <>
      <PageHeader
        title="Độc giả"
        description="Hồ sơ và thẻ thư viện"
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Đóng' : 'Thêm độc giả'}
          </Button>
        }
      />
      {showForm && (
        <Card className="mb-6 text-left">
          <form onSubmit={handleRegister} className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Mật khẩu" name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <Input label="Họ tên" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="SĐT" name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Button type="submit">Đăng ký</Button>
          </form>
        </Card>
      )}
      <Card className="overflow-x-auto p-0 text-left">
        {loading ? (
          <p className="p-6 text-sm">Đang tải…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-violet-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Mã thẻ</th>
                <th className="px-4 py-3 text-left font-semibold">Họ tên</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-violet-50">
                  <td className="px-4 py-3 font-mono">{m.libraryCardId}</td>
                  <td className="px-4 py-3">{m.name}</td>
                  <td className="px-4 py-3">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={m.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {m.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" onClick={() => toggleStatus(m)}>
                      {m.status === 'ACTIVE' ? 'Khóa thẻ' : 'Mở thẻ'}
                    </Button>
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
