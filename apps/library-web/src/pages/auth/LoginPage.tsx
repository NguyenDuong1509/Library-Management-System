import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { loadSession, roleHomePath, useAuth } from '../../lib/auth'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  const { session, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('thuthu@lms.vn')
  const [password, setPassword] = useState('thuthu123')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) {
    return <Navigate to={roleHomePath(session.user)} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await login(email, password)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    const stored = loadSession()
    if (stored) {
      navigate(roleHomePath(stored.user))
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md text-left">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-primary-dark">
              Đăng nhập LMS
            </h1>
            <p className="text-sm text-primary-dark/70">
              Hệ thống quản lý thư viện
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mật khẩu"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={error ?? undefined}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>

        <div className="mt-6 rounded-lg bg-violet-50 p-4 text-xs text-primary-dark/80">
          <p className="font-semibold text-primary-dark">Tài khoản demo (API)</p>
          <ul className="mt-2 space-y-1">
            <li>Thủ thư: thuthu@lms.vn / thuthu123</li>
            <li>Quản trị: admin@lms.vn / admin123</li>
            <li>Độc giả: docgia@lms.vn / docgia123</li>
          </ul>
          <p className="mt-2 text-primary-dark/60">
            API: {import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}
          </p>
        </div>
      </Card>
    </div>
  )
}
