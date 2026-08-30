import { useAuth } from '../lib/AuthContext'
import TypingWord from '../components/TypingWord'

const GREETING_PREFIX = 'Welcome back, '

export default function HomePage() {
  const { user } = useAuth()
  const username = user?.email.split('@')[0] ?? ''
  const fullText = username ? `${GREETING_PREFIX}${username}` : ''

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <h1 className="text-4xl font-semibold text-slate-900">
        <TypingWord text={fullText} highlightFrom={GREETING_PREFIX.length} />
      </h1>
    </div>
  )
}
