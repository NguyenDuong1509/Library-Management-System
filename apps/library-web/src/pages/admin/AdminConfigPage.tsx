import { useEffect, useState } from 'react'
import {
  fetchAdminConfig,
  updateAdminConfig,
  type LibraryConfigApi,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Toast } from '../../components/ui/Toast'

export function AdminConfigPage() {
  const { session } = useAuth()
  const [config, setConfig] = useState<LibraryConfigApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = session?.token
    if (!token) return
    setLoading(true)
    fetchAdminConfig(token)
      .then(setConfig)
      .catch(() => setError('Không tải được cấu hình. Chỉ Admin được truy cập.'))
      .finally(() => setLoading(false))
  }, [session?.token])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const token = session?.token
    if (!token || !config) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateAdminConfig(token, config)
      setConfig(updated)
      setToast('Đã lưu cấu hình.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-primary-dark/60">Đang tải cấu hình…</p>
  }

  if (!config) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
        {error ?? 'Không có dữ liệu cấu hình.'}
      </p>
    )
  }

  return (
    <>
      <PageHeader title="Cấu hình" description="Chính sách mượn và phạt (Admin)" />
      {error && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
      <Card className="max-w-lg space-y-4 text-left">
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Số sách mượn tối đa"
            name="maxLoanCount"
            type="number"
            value={config.maxLoanCount}
            onChange={(e) =>
              setConfig({ ...config, maxLoanCount: Number(e.target.value) })
            }
          />
          <Input
            label="Số ngày mượn mặc định"
            name="loanDaysDefault"
            type="number"
            value={config.loanDaysDefault}
            onChange={(e) =>
              setConfig({ ...config, loanDaysDefault: Number(e.target.value) })
            }
          />
          <Input
            label="Số lần gia hạn tối đa"
            name="maxRenewals"
            type="number"
            value={config.maxRenewals}
            onChange={(e) =>
              setConfig({ ...config, maxRenewals: Number(e.target.value) })
            }
          />
          <Input
            label="Phạt mỗi ngày (VND)"
            name="finePerDay"
            type="number"
            value={config.finePerDay}
            onChange={(e) =>
              setConfig({ ...config, finePerDay: Number(e.target.value) })
            }
          />
          <Input
            label="Nhắc trước (ngày)"
            name="reminderDaysBefore"
            type="number"
            value={config.reminderDaysBefore}
            onChange={(e) =>
              setConfig({ ...config, reminderDaysBefore: Number(e.target.value) })
            }
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
          </Button>
        </form>
      </Card>
      {toast && <Toast message={toast} />}
    </>
  )
}
