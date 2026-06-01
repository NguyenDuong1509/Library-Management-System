import { useEffect, useState } from 'react'
import {
  createAdminUser,
  deactivateAdminUser,
  fetchAdminUsers,
  fetchAuditLogs,
  updateAdminUserRole,
  type AdminUserApi,
  type AuditLogApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Toast } from '../../components/ui/Toast'

type Tab = 'users' | 'audit'

export function AdminUsersPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<AdminUserApi[]>([])
  const [audit, setAudit] = useState<AuditLogApi[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'LIBRARIAN' as 'ADMIN' | 'LIBRARIAN',
  })

  async function loadUsers() {
    if (!token) return
    setUsers(await fetchAdminUsers(token))
  }

  async function loadAudit() {
    if (!token) return
    const page = await fetchAuditLogs(token)
    setAudit(page.content)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadUsers(), loadAudit()]).finally(() => setLoading(false))
  }, [token])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    await createAdminUser(token, form)
    setToast('Đã tạo tài khoản.')
    setForm({ email: '', password: '', name: '', role: 'LIBRARIAN' })
    await loadUsers()
  }

  async function handleDeactivate(userId: string) {
    if (!token) return
    await deactivateAdminUser(token, userId)
    setToast('Đã vô hiệu hóa tài khoản.')
    await loadUsers()
  }

  async function handleRole(userId: string, role: 'ADMIN' | 'LIBRARIAN') {
    if (!token) return
    await updateAdminUserRole(token, userId, role)
    setToast('Đã cập nhật vai trò.')
    await loadUsers()
  }

  return (
    <>
      <PageHeader title="Quản lý người dùng" description="Tài khoản thủ thư và nhật ký audit" />
      <div className="mb-4 flex gap-2">
        <Button variant={tab === 'users' ? 'primary' : 'secondary'} onClick={() => setTab('users')}>
          Người dùng
        </Button>
        <Button variant={tab === 'audit' ? 'primary' : 'secondary'} onClick={() => setTab('audit')}>
          Audit log
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-primary-dark/60">Đang tải…</p>
      ) : tab === 'users' ? (
        <>
          <Card className="mb-6 text-left">
            <h2 className="mb-4 font-semibold">Tạo thủ thư / admin</h2>
            <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Mật khẩu"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Input
                label="Họ tên"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div>
                <label className="mb-1 block text-sm font-medium">Vai trò</label>
                <select
                  className="w-full rounded-lg border border-violet-100 px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as 'ADMIN' | 'LIBRARIAN' })
                  }
                >
                  <option value="LIBRARIAN">LIBRARIAN</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Tạo</Button>
              </div>
            </form>
          </Card>
          <Card className="overflow-x-auto p-0 text-left">
            <table className="w-full text-sm">
              <thead className="bg-violet-50">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Tên</th>
                  <th className="px-4 py-3 text-left">Vai trò</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-violet-50">
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.active ? 'success' : 'warning'}>
                        {u.active ? 'Hoạt động' : 'Vô hiệu'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.active && (
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => handleDeactivate(u.id)}>
                            Vô hiệu hóa
                          </Button>
                          {u.role === 'LIBRARIAN' && (
                            <Button variant="ghost" onClick={() => handleRole(u.id, 'ADMIN')}>
                              → Admin
                            </Button>
                          )}
                          {u.role === 'ADMIN' && (
                            <Button variant="ghost" onClick={() => handleRole(u.id, 'LIBRARIAN')}>
                              → Thủ thư
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <Card className="overflow-x-auto p-0 text-left">
          <table className="w-full text-sm">
            <thead className="bg-violet-50">
              <tr>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-left">Hành động</th>
                <th className="px-4 py-3 text-left">Đối tượng</th>
                <th className="px-4 py-3 text-left">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-violet-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">{a.action}</td>
                  <td className="px-4 py-3">
                    {a.targetType} {a.targetId ?? ''}
                  </td>
                  <td className="px-4 py-3">{a.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {toast && <Toast message={toast} />}
    </>
  )
}
