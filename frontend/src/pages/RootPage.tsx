import { useAuth } from '../lib/AuthContext'
import AppLayout from '../components/AppLayout'
import HomePage from './HomePage'
import LandingPage from './LandingPage'

export default function RootPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 text-sm text-slate-400">
        Loading…
      </div>
    )
  }

  if (user) {
    return (
      <AppLayout>
        <HomePage />
      </AppLayout>
    )
  }

  return <LandingPage />
}
