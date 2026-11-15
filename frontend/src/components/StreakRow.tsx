import { motion, useReducedMotion } from 'motion/react'
import type { Streak } from '../lib/api'

const DAYS = 7
const EASE = [0.22, 1, 0.36, 1] as const

function copyFor(streak: Streak): string {
  if (!streak.is_new_day) return `Already counted today. Come back tomorrow for day ${streak.current + 1}.`
  if (streak.current === 1 && streak.longest > 1) return `Streak restarted at day 1. Your longest is ${streak.longest}.`
  if (streak.current === 1) return 'First quiz done. Practice again tomorrow to keep it going.'
  return `You've practiced ${streak.current} days in a row.`
}

export default function StreakRow({ streak }: { streak: Streak }) {
  const reduce = useReducedMotion()
  const filled = Math.min(streak.current, DAYS)

  // Oldest to newest, ending today. A streak is consecutive, so the filled
  // cells are simply the last `filled` days.
  const cells = Array.from({ length: DAYS }, (_, i) => {
    const daysAgo = DAYS - 1 - i
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return {
      daysAgo,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      done: daysAgo < filled,
    }
  })

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Streak</p>
        <p className="mt-1 font-display text-2xl font-semibold leading-none">Day {streak.current}</p>
        <p className="mt-2 text-sm text-slate-600">{copyFor(streak)}</p>
      </div>

      <ol className="flex gap-1.5" aria-label={`Last 7 days, ${filled} practiced`}>
        {cells.map((c) => {
          const isToday = c.daysAgo === 0
          return (
            <li key={c.daysAgo} className="flex flex-col items-center gap-1">
              <motion.span
                className={`h-6 w-6 rounded-md ${c.done ? (isToday ? 'bg-brand' : 'bg-ink') : 'bg-line'}`}
                initial={isToday && streak.is_new_day && !reduce ? { scale: 0.7 } : false}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: EASE }}
              />
              <span className="font-mono text-[10px] text-slate-500">{c.label}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
