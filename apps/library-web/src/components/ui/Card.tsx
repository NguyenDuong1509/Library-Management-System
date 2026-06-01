import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-violet-100 bg-white p-6 shadow-md transition duration-200 ${className}`}
    >
      {children}
    </div>
  )
}

export function KpiCard({
  label,
  value,
  hint,
  hintTone = 'neutral',
}: {
  label: string
  value: string | number
  hint?: string
  hintTone?: 'neutral' | 'warning' | 'danger'
}) {
  const hintClass =
    hintTone === 'warning'
      ? 'text-amber-600'
      : hintTone === 'danger'
        ? 'text-red-600'
        : 'text-primary/70'

  return (
    <Card>
      <p className="text-sm font-medium text-primary-dark/70">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-primary-dark">{value}</p>
      {hint ? <p className={`mt-1 text-sm ${hintClass}`}>{hint}</p> : null}
    </Card>
  )
}
