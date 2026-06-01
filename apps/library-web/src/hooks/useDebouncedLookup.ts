import { useEffect, useState } from 'react'

export function useDebouncedLookup<T>(
  value: string,
  lookup: (query: string) => Promise<T>,
  delayMs = 300,
) {
  const [result, setResult] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setResult(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const timer = window.setTimeout(() => {
      lookup(trimmed)
        .then((data) => {
          if (!cancelled) {
            setResult(data)
            setError(null)
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setResult(null)
            setError(err instanceof Error ? err.message : 'Tra cứu thất bại.')
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, delayMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [value, lookup, delayMs])

  return { result, loading, error }
}
