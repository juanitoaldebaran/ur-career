import { Link } from 'react-router-dom'

export default function Logo({
  inverted = false,
  className = '',
  labelClassName = '',
}: {
  inverted?: boolean
  className?: string
  labelClassName?: string
}) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight ${className}`}>
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-[13px] font-bold leading-none text-white"
      >
        u
      </span>
      <span className={`${inverted ? 'text-white' : 'text-ink'} ${labelClassName}`}>ur-career</span>
    </Link>
  )
}
