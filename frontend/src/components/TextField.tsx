import { useId, type InputHTMLAttributes } from 'react'

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete']
  placeholder?: string
  required?: boolean
  list?: string
}

export default function TextField({ label, value, onChange, type = 'text', autoComplete, placeholder, required, list }: TextFieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        list={list}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </div>
  )
}
