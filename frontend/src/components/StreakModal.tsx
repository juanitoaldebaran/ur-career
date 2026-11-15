import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Streak } from '../lib/api'

const EASE = [0.22, 1, 0.36, 1] as const

function message(streak: Streak): string {
  if (streak.current === 1 && streak.longest > 1) return `Streak restarted. Your longest is ${streak.longest} days.`
  if (streak.current === 1) return 'You started a streak. Practice again tomorrow to keep it going.'
  return `${streak.current} days in a row. Practice again tomorrow to keep it going.`
}

export default function StreakModal({
  streak,
  open,
  onClose,
}: {
  streak: Streak
  open: boolean
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const continueRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    continueRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="streak-title"
            className="relative w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-xl"
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <svg viewBox="0 0 24 24" className="mx-auto h-14 w-14 text-brand" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>

            <p className="eyebrow mt-5">Daily streak</p>
            <h2 id="streak-title" className="mt-3 flex items-baseline justify-center gap-2">
              <span className="font-display text-7xl font-semibold leading-none text-brand">{streak.current}</span>
              <span className="font-display text-xl font-medium text-ink">{streak.current === 1 ? 'day' : 'days'}</span>
            </h2>

            <p className="mx-auto mt-4 max-w-[17rem] text-sm leading-relaxed text-slate-600">{message(streak)}</p>

            <span className="chip mt-5 font-mono">Best: {streak.longest} {streak.longest === 1 ? 'day' : 'days'}</span>

            <button ref={continueRef} onClick={onClose} className="btn btn-primary mt-6 w-full">
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
