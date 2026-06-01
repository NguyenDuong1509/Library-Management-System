import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
  UserCircle,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { searchGlobal, type SearchResultApi } from '../../lib/api'
import { memberMuonTraUrl } from '../../lib/muonTraPrefill'
import { Button } from '../ui/Button'

const nav = [
  { to: '/thu-thu', label: 'Bảng điều khiển', icon: LayoutDashboard, end: true },
  { to: '/thu-thu/sach', label: 'Danh mục sách', icon: BookOpen },
  { to: '/thu-thu/doc-gia', label: 'Độc giả', icon: Users },
  { to: '/thu-thu/muon-tra', label: 'Mượn / Trả', icon: ClipboardList },
  { to: '/thu-thu/dat-truoc', label: 'Đặt trước', icon: BookOpen },
  { to: '/thu-thu/phat', label: 'Phạt', icon: Receipt },
  { to: '/thu-thu/bao-cao', label: 'Báo cáo', icon: ClipboardList },
  { to: '/thu-thu/thong-bao', label: 'Thông báo', icon: ClipboardList },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useAuth()
  return (
    <>
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200 ${
              isActive
                ? 'border-l-4 border-primary bg-primary/10 text-primary'
                : 'text-primary-dark/80 hover:bg-violet-50'
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          {label}
        </NavLink>
      ))}
      {session?.user.role === 'ADMIN' ? (
        <>
          <NavLink
            to="/admin/cau-hinh"
            onClick={onNavigate}
            className={({ isActive }) =>
              `mt-4 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200 ${
                isActive
                  ? 'border-l-4 border-primary bg-primary/10 text-primary'
                  : 'text-primary-dark/80 hover:bg-violet-50'
              }`
            }
          >
            <Settings className="h-5 w-5 shrink-0" aria-hidden />
            Cấu hình
          </NavLink>
          <NavLink
            to="/admin/users"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200 ${
                isActive
                  ? 'border-l-4 border-primary bg-primary/10 text-primary'
                  : 'text-primary-dark/80 hover:bg-violet-50'
              }`
            }
          >
            <Users className="h-5 w-5 shrink-0" aria-hidden />
            Người dùng
          </NavLink>
        </>
      ) : null}
    </>
  )
}

export function LibrarianLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultApi | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const token = session?.token ?? ''

  const handleLogout = () => {
    logout()
    navigate('/dang-nhap')
  }

  const runSearch = useCallback(
    (q: string) => {
      if (!token || q.trim().length < 2) {
        setSearchResults(null)
        return
      }
      searchGlobal(token, q.trim())
        .then(setSearchResults)
        .catch(() => setSearchResults(null))
    },
    [token],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(searchQuery), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, runSearch])

  function closeDrawer() {
    setDrawerOpen(false)
  }

  function navigateTo(path: string) {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults(null)
    navigate(path)
  }

  return (
    <div className="flex min-h-svh bg-surface">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-violet-100 bg-white lg:flex">
        <div className="border-b border-violet-100 px-6 py-5">
          <p className="text-lg font-bold text-primary">LMS Thư viện</p>
          <p className="text-xs text-primary-dark/60">Khu vực thủ thư</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavItems />
        </nav>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Đóng menu"
            onClick={closeDrawer}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-violet-100 px-4 py-4">
              <p className="font-bold text-primary">LMS Thư viện</p>
              <button type="button" onClick={closeDrawer} aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              <NavItems onNavigate={closeDrawer} />
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-violet-100 bg-white px-4 py-3 lg:px-6">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-violet-50 lg:hidden"
            aria-label="Mở menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5 text-primary" />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Tìm nhanh sách, độc giả, mã thẻ…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Tìm nhanh"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults?.books[0]) {
                  navigateTo(`/thu-thu/sach/${searchResults.books[0].slug}`)
                }
              }}
            />
            {searchOpen && searchResults && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {searchResults.books.length > 0 && (
                  <div className="border-b border-slate-100 p-2">
                    <p className="px-2 text-xs font-semibold text-slate-500">Sách</p>
                    {searchResults.books.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-violet-50"
                        onClick={() => navigateTo(`/thu-thu/sach/${b.slug}`)}
                      >
                        {b.title}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.members.length > 0 && (
                  <div className="border-b border-slate-100 p-2">
                    <p className="px-2 text-xs font-semibold text-slate-500">Độc giả</p>
                    {searchResults.members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-violet-50"
                        onClick={() => navigateTo(memberMuonTraUrl(m.libraryCardId))}
                      >
                        {m.name} — {m.libraryCardId}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.copies.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 text-xs font-semibold text-slate-500">Bản sao</p>
                    {searchResults.copies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-violet-50"
                        onClick={() => navigateTo(`/thu-thu/sach/${c.bookSlug}`)}
                      >
                        {c.copyCode} — {c.bookTitle}
                      </button>
                    ))}
                  </div>
                )}
                {!searchResults.books.length &&
                  !searchResults.members.length &&
                  !searchResults.copies.length && (
                    <p className="p-3 text-sm text-slate-500">Không có kết quả</p>
                  )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-primary-dark">
            <UserCircle className="h-5 w-5 text-primary" aria-hidden />
            <span className="hidden sm:inline">{session?.user.name}</span>
            <Button variant="ghost" onClick={handleLogout} aria-label="Đăng xuất">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
