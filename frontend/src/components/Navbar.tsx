import { Link, NavLink } from 'react-router-dom'
import UserMenu from './UserMenu'

const NAV_ITEMS = [
  { label: 'Consultation', to: '/consultation' },
  { label: 'CV Builder', to: '/cv-builder' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Practice', to: '/practice' },
]

export default function Navbar() {
  return (
    <header className="fixed left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-8 rounded-full border border-slate-200 bg-white px-6 py-2 shadow-sm">
      <Link to="/" className="text-lg font-semibold tracking-tight">
        <span className="text-blue-600">ur</span>
        <span className="text-black">-career</span>
      </Link>

      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <UserMenu />
    </header>
  )
}
