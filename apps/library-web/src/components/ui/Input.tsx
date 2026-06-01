import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name ?? label
  return (
    <div className="text-left">
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-primary-dark"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-primary-dark transition duration-200 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
