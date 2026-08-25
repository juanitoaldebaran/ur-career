import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return null
  }

  const initial = user.email.charAt(0).toUpperCase()

  return (
    <div ref={menuRef} className="absolute right-4 top-4">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 cursor-pointer "
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
          <p className="truncate border-b border-slate-100 px-3 py-2 text-sm text-slate-500">
            {user.email}
          </p>
          <button
            onClick={() => void logout()}
            className="w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
