import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import Logo from './Logo'

const EASE = [0.22, 1, 0.36, 1] as const

const POINTS = [
  'Roadmaps with curated resources for four careers',
  'A CV builder and interview practice in one place',
  'Progress saved as you learn',
]

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand/40 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />
        <Logo inverted className="relative" />

        <div className="relative max-w-md">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-4xl font-semibold leading-tight xl:text-5xl"
          >
            Your career, <span className="text-blue-400">mapped out.</span>
          </motion.h2>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((point, i) => (
              <motion.li
                key={point}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.6, ease: EASE }}
                className="flex items-start gap-3 text-[15px] text-slate-300"
              >
                <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                {point}
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-xs text-slate-500">© {new Date().getFullYear()} ur-career</p>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10">
        <Logo className="lg:hidden" />
        <div className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-full max-w-sm"
          >
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p className="mt-2 text-[15px] text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-8 text-center text-sm text-slate-500">{footer}</p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
