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
import Logo from './Logo'
import UserMenu from './UserMenu'
import { Icon, type IconName } from './icons'

const NAV_ITEMS: { label: string; to: string; icon: IconName }[] = [
  { label: 'Consultation', to: '/consultation', icon: 'chat' },
  { label: 'CV Builder', to: '/cv-builder', icon: 'file' },
  { label: 'CV Review', to: '/cv-review', icon: 'upload' },
  { label: 'Roadmap', to: '/roadmap', icon: 'map' },
  { label: 'Practice', to: '/practice', icon: 'code' },
]

function Divider() {
  return <span aria-hidden="true" className="mx-1.5 hidden h-5 w-px shrink-0 bg-line md:block" />
}

const EASE = [0.22, 1, 0.36, 1] as const

function isActivePath(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function Navbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28 })

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0
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
        className="fixed inset-x-0 top-0 z-30 h-0.5 origin-left bg-brand"
      />

      {/* Centred on the content area: --sidebar-w is set by pages that have a sidebar
          (0 elsewhere). The header is a container, so labels drop out when space is tight. */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
        className="@container pointer-events-none fixed inset-x-0 top-4 z-20 flex justify-center pl-[calc(var(--sidebar-w,0px)_+_1rem)] pr-4 transition-[padding-left] duration-200 ease-out motion-reduce:transition-none"
      >
        <div className="pointer-events-auto flex w-full max-w-full items-center justify-between gap-1 rounded-full border border-line/80 bg-transparent p-1.5 backdrop-blur-md md:w-auto md:justify-start">
          <div className="flex items-center pl-2.5 pr-1">
            <Logo labelClassName="hidden @[30rem]:inline" />
          </div>

          <Divider />

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  title={item.label}
                  className={`relative isolate flex h-9 items-center gap-2 rounded-full px-2.5 text-sm font-medium transition-colors duration-150 @[54rem]:px-3.5 ${
                    active ? 'text-white' : 'text-slate-600 hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-brand"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                  <span className="hidden @[54rem]:inline">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <Divider />

          <div className="hidden md:flex md:items-center">
            {user ? (
              <UserMenu />
            ) : (
              <Link to="/login" className="btn btn-primary !h-9 !rounded-full !px-4 !py-0">
                Sign in
              </Link>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-ink/5 md:hidden"
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
        </div>
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
              className="fixed inset-0 z-10 bg-ink/20 backdrop-blur-sm md:hidden"
            />
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.28, ease: EASE }}
              style={{ transformOrigin: 'top center' }}
              className="fixed inset-x-4 top-20 z-10 flex flex-col gap-1 rounded-2xl border border-line bg-white p-3 md:hidden"
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
                          ? 'bg-brand text-white'
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
                className="mt-1 flex flex-col gap-1 border-t border-line pt-3"
              >
                {user ? (
                  <UserMenu inline />
                ) : (
                  <Link
                    to="/login"
                    className="btn btn-primary w-full"
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
