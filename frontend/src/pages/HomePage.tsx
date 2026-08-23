import { useAuth } from '../lib/AuthContext'
import { useTypewriter } from '../hooks/useTypewriter'

const GREETING_PREFIX = 'Welcome back, '

export default function HomePage() {
  const { user } = useAuth()
  const username = user?.email.split('@')[0] ?? ''
  const fullText = username ? `${GREETING_PREFIX}${username}` : ''
  const typed = useTypewriter(fullText)

  const prefix = typed.slice(0, GREETING_PREFIX.length)
  const name = typed.slice(GREETING_PREFIX.length)

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4">
      <h1 className="text-4xl font-semibold text-slate-900">
        {prefix}
        <span className="text-blue-600">{name}</span>
        <span
          className="-mb-1 ml-0.5 inline-block h-5 w-px animate-pulse bg-slate-900"
          aria-hidden="true"
        />
      </h1>
    </div>
  )
}
