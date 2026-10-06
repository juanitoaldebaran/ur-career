import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import UserMenu from './UserMenu'

const NAV_ITEMS = [
  { label: 'Consultation', to: '/consultation' },
  { label: 'CV Builder', to: '/cv-builder' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Practice', to: '/practice' },
]

const EASE = [0.22, 1, 0.36, 1] as const

function isActivePath(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function Navbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28 })

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    setScrolled(latest > 12)
    setHidden(latest > previous && latest > 140 && !mobileOpen)
  })

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-30 h-0.5 origin-left bg-blue-600"
      />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
        className="fixed left-1/2 top-4 z-20 w-[calc(100%-2rem)] max-w-fit -translate-x-1/2"
      >
        <motion.div
          animate={{
            paddingTop: scrolled ? 6 : 8,
            paddingBottom: scrolled ? 6 : 8,
          }}
          transition={{ duration: 0.25 }}
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300 sm:gap-8 sm:px-6 ${
            scrolled
              ? 'border-slate-200 bg-white/85 shadow-lg shadow-slate-900/5'
              : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <Link to="/" className="group text-lg font-bold tracking-tight">
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <span className="text-blue-600">ur</span>
              <span className="text-black">-career</span>
            </motion.span>
          </Link>

          <nav
            className="relative hidden items-center gap-1 md:flex"
            onMouseLeave={() => setHovered(null)}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onMouseEnter={() => setHovered(item.to)}
                  onFocus={() => setHovered(item.to)}
                  onBlur={() => setHovered(null)}
                  className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {hovered === item.to && !active && (
                    <motion.span
                      layoutId="nav-hover"
                      className="absolute inset-0 -z-10 rounded-full bg-slate-100"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-blue-50"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="hidden md:flex md:items-center">
            {user ? (
              <UserMenu />
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/login"
                  className="block rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  Sign in
                </Link>
              </motion.div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <motion.path
                animate={mobileOpen ? { d: 'M6 6l12 12' } : { d: 'M4 7h16' }}
                transition={{ duration: 0.25 }}
              />
              <motion.path
                animate={{ opacity: mobileOpen ? 0 : 1 }}
                transition={{ duration: 0.15 }}
                d="M4 12h16"
              />
              <motion.path
                animate={mobileOpen ? { d: 'M18 6L6 18' } : { d: 'M4 17h16' }}
                transition={{ duration: 0.25 }}
              />
            </svg>
          </motion.button>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-10 bg-slate-900/20 backdrop-blur-sm md:hidden"
            />
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.28, ease: EASE }}
              style={{ transformOrigin: 'top center' }}
              className="fixed inset-x-4 top-20 z-10 flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:hidden"
            >
              {NAV_ITEMS.map((navItem, index) => {
                const active = isActivePath(pathname, navItem.to)
                return (
                  <motion.div
                    key={navItem.to}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.05, duration: 0.3, ease: EASE }}
                  >
                    <NavLink
                      to={navItem.to}
                      className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-700 hover:bg-slate-100 active:bg-slate-100'
                      }`}
                    >
                      {navItem.label}
                      <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    </NavLink>
                  </motion.div>
                )
              })}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-1 flex flex-col gap-1 border-t border-slate-200 pt-3"
              >
                {user ? (
                  <UserMenu inline />
                ) : (
                  <Link
                    to="/login"
                    className="rounded-xl bg-slate-900 px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-600"
                  >
                    Sign in
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
