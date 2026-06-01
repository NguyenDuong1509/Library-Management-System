interface ToastProps {
  message: string
  tone?: 'success' | 'error'
}

export function Toast({ message, tone = 'success' }: ToastProps) {
  const styles =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
      : 'bg-red-50 text-red-900 border-red-200'

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm shadow-md ${styles}`}
    >
      {message}
    </div>
  )
}
