import { useAuth } from '../lib/AuthContext'

export default function HomePage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Welcome&apos;You have been logged in</h1>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
        <button
          onClick={() => void logout()}
          className="mt-6 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
