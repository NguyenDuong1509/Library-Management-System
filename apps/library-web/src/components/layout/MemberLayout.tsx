import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { Button } from '../ui/Button'

const nav = [
  { to: '/doc-gia', label: 'Trang chủ', end: true },
  { to: '/doc-gia/tim-sach', label: 'Tìm sách' },
  { to: '/doc-gia/phieu-muon', label: 'Phiếu mượn' },
  { to: '/doc-gia/dat-truoc', label: 'Đặt trước' },
  { to: '/doc-gia/phat', label: 'Phạt' },
  { to: '/doc-gia/thong-bao', label: 'Thông báo' },
]

export function MemberLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-svh bg-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-lg font-bold text-slate-900">LMS Độc giả</p>
            <p className="text-xs text-slate-500">Xin chào, {session?.user.name}</p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition duration-200 ${
                    isActive
                      ? 'bg-sky-100 text-sky-900'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Button
            variant="ghost"
            onClick={() => {
              logout()
              navigate('/dang-nhap')
            }}
          >
            <LogOut className="h-4 w-4" />
            Thoát
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  )
}
