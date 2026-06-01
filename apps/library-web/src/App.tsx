import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LibrarianLayout } from './components/layout/LibrarianLayout'
import { MemberLayout } from './components/layout/MemberLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/thu-thu/DashboardPage'
import { BooksPage } from './pages/thu-thu/BooksPage'
import { MembersPage } from './pages/thu-thu/MembersPage'
import { LoanReturnPage } from './pages/thu-thu/LoanReturnPage'
import { ReservationsDeskPage } from './pages/thu-thu/ReservationsDeskPage'
import { FinesPage } from './pages/thu-thu/FinesPage'
import { ReportsPage } from './pages/thu-thu/ReportsPage'
import { AdminConfigPage } from './pages/admin/AdminConfigPage'
import { HomePage } from './pages/doc-gia/HomePage'
import { BookSearchPage } from './pages/doc-gia/BookSearchPage'
import { MyLoansPage } from './pages/doc-gia/MyLoansPage'
import { BookDetailPage } from './pages/thu-thu/BookDetailPage'
import { NotificationsPage as LibrarianNotificationsPage } from './pages/doc-gia/NotificationsPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { MemberReservationsPage } from './pages/doc-gia/MemberReservationsPage'
import { MemberFinesPage } from './pages/doc-gia/MemberFinesPage'
import { NotificationsPage } from './pages/doc-gia/NotificationsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dang-nhap" replace />} />

          <Route element={<ProtectedRoute roles={['ADMIN', 'LIBRARIAN']} />}>
            <Route element={<LibrarianLayout />}>
              <Route path="/thu-thu" element={<DashboardPage />} />
              <Route path="/thu-thu/sach" element={<BooksPage />} />
              <Route path="/thu-thu/sach/:slug" element={<BookDetailPage />} />
              <Route path="/thu-thu/thong-bao" element={<LibrarianNotificationsPage />} />
              <Route path="/thu-thu/doc-gia" element={<MembersPage />} />
              <Route path="/thu-thu/muon-tra" element={<LoanReturnPage />} />
              <Route path="/thu-thu/dat-truoc" element={<ReservationsDeskPage />} />
              <Route path="/thu-thu/phat" element={<FinesPage />} />
              <Route path="/thu-thu/bao-cao" element={<ReportsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route element={<LibrarianLayout />}>
              <Route path="/admin/cau-hinh" element={<AdminConfigPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={['MEMBER']} />}>
            <Route element={<MemberLayout />}>
              <Route path="/doc-gia" element={<HomePage />} />
              <Route path="/doc-gia/tim-sach" element={<BookSearchPage />} />
              <Route path="/doc-gia/phieu-muon" element={<MyLoansPage />} />
              <Route path="/doc-gia/dat-truoc" element={<MemberReservationsPage />} />
              <Route path="/doc-gia/phat" element={<MemberFinesPage />} />
              <Route path="/doc-gia/thong-bao" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dang-nhap" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
