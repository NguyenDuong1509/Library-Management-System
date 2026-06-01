import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthSession, User, UserRole } from '../types'
import { ApiError, loginApi } from './api'

const STORAGE_KEY = 'lms_auth'

interface AuthContextValue {
  session: AuthSession | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(loadSession)

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginApi(email, password)
      const next: AuthSession = {
        token: data.token,
        user: {
          id: data.userId,
          email: data.email,
          name: data.name,
          role: data.role,
        },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSession(next)
      return null
    } catch (e) {
      if (e instanceof ApiError) {
        return e.message
      }
      return 'Không kết nối được máy chủ. Kiểm tra API đang chạy tại ' +
        (import.meta.env.VITE_API_URL ?? 'http://localhost:8080')
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]) =>
      session ? roles.includes(session.user.role) : false,
    [session],
  )

  const value = useMemo(
    () => ({ session, login, logout, hasRole }),
    [session, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function roleHomePath(user: User): string {
  if (user.role === 'MEMBER') return '/doc-gia'
  return '/thu-thu'
}
