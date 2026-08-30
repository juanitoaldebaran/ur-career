import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Consultation', to: '/consultation' },
  { label: 'CV Builder', to: '/cv-builder' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Practice', to: '/practice' },
]

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white pt-20">
      <nav className="flex flex-col gap-1 px-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition ${
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
    </aside>
  )
}
