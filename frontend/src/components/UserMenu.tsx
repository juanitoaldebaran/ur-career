import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/AuthContext'

interface UserMenuProps {
  /** Render as a static block (used inside the mobile panel) instead of a dropdown. */
  inline?: boolean
}

export default function UserMenu({ inline = false }: UserMenuProps) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  if (!user) {
    return null
  }

  const initial = user.email.charAt(0).toUpperCase()

  if (inline) {
    return (
      <div className="flex items-center gap-3 px-1">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
          {initial}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-slate-500">{user.email}</p>
        <button
          onClick={() => void logout()}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
        >
          Log out
        </button>
      </div>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm font-medium text-white transition-colors ${
          open ? 'bg-blue-600' : 'bg-slate-900 hover:bg-blue-600'
        }`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
      >
        {initial}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl"
          >
            <p className="truncate border-b border-slate-100 px-3 py-2 text-sm text-slate-500">
              {user.email}
            </p>
            <button
              onClick={() => void logout()}
              className="w-full px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
            >
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
