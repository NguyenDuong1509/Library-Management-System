import { Navigate, Outlet } from 'react-router-dom'
import { roleHomePath, useAuth } from '../../lib/auth'
import type { UserRole } from '../../types'

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { session, hasRole } = useAuth()

  if (!session) {
    return <Navigate to="/dang-nhap" replace />
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to={roleHomePath(session.user)} replace />
  }

  return <Outlet />
}
