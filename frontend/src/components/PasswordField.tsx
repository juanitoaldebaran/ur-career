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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <span className="relative flex items-center">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-ink"
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
    </div>
  )
}
