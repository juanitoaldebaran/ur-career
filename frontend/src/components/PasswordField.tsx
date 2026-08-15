import { useId, useState, type InputHTMLAttributes } from 'react'

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: InputHTMLAttributes<HTMLInputElement>['autoComplete']
  required?: boolean
  minLength?: number
  helperText?: string
}

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  helperText,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const id = useId()

  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm text-slate-700">
      {label}
      <span className="relative flex items-center">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 outline-none focus:border-slate-500"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-2 flex h-6 w-6 items-center justify-center text-slate-400 transition hover:text-slate-600"
        >
          {visible ? (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="10" r="2.25" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="10" r="2.25" />
              <line x1="3.5" y1="16.5" x2="16.5" y2="3.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </span>
      {helperText && <span className="text-xs text-slate-400">{helperText}</span>}
    </label>
  )
}
