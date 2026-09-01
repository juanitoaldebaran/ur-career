import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import UserMenu from './UserMenu'

const NAV_ITEMS = [
  { label: 'Consultation', to: '/consultation' },
  { label: 'CV Builder', to: '/cv-builder' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Practice', to: '/practice' },
]

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-50 text-blue-600'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`
}

export default function Navbar() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="fixed left-1/2 top-4 z-20 flex w-[calc(100%-2rem)] max-w-fit -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm sm:gap-8 sm:px-6">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          <span className="text-blue-600">ur</span>
          <span className="text-black">-career</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex md:items-center">
          {user ? (
            <UserMenu />
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-4 top-20 z-10 flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={navLinkClassName}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="mt-1 flex flex-col gap-1 border-t border-slate-200 pt-2">
            {user ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-center text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
