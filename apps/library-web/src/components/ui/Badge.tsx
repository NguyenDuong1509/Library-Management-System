import type { CopyStatus } from '../../types'
import { COPY_STATUS_LABEL } from '../../lib/mock-data'

const styles: Record<CopyStatus, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800',
  ON_LOAN: 'bg-violet-100 text-violet-800',
  RESERVED: 'bg-amber-100 text-amber-800',
  LOST: 'bg-red-100 text-red-800',
  MAINTENANCE: 'bg-slate-100 text-slate-700',
}

export function CopyStatusBadge({ status }: { status: CopyStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {COPY_STATUS_LABEL[status]}
    </span>
  )
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'warning' | 'danger' | 'success'
  className?: string
}) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    success: 'bg-emerald-100 text-emerald-800',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
