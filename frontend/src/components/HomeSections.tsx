import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from 'motion/react'

const EASE = [0.22, 1, 0.36, 1] as const

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

function SectionHeading({ eyebrow, title, accent, subtitle }: {
  eyebrow: string
  title: string
  accent: string
  subtitle: string
}) {
  return (
    <motion.div variants={fadeUp} className="mx-auto mb-12 max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">{eyebrow}</span>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {title} <span className="text-blue-600">{accent}</span>
      </h2>
      <p className="mt-3 text-slate-500">{subtitle}</p>
    </motion.div>
  )
}

const STEPS = [
  { title: 'Talk it through', body: 'Share your background and goals in a consultation to find the right direction.' },
  { title: 'Follow a roadmap', body: 'Get a structured learning path and tick off each milestone as you grow.' },
  { title: 'Build your CV', body: 'Turn your skills and projects into a clear, recruiter-ready resume.' },
  { title: 'Practice & apply', body: 'Rehearse with interview-style challenges until you feel ready.' },
]

export function HowItWorks() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] })
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 28 })

  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className="mx-auto max-w-4xl px-4 pb-28 sm:px-6"
    >
      <SectionHeading
        eyebrow="How it works"
        title="From unsure to"
        accent="interview-ready"
        subtitle="Four simple steps that take you from first question to confident applications."
      />

      <div ref={ref} className="relative">
        <div aria-hidden="true" className="absolute bottom-4 left-5 top-4 w-px bg-slate-200 md:left-1/2">
          <motion.div
            style={{ scaleY: reduce ? 1 : line }}
            className="h-full origin-top bg-blue-600"
          />
        </div>

        <ol className="space-y-10">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              variants={fadeUp}
              className={`relative flex items-start gap-5 pl-14 md:w-1/2 md:pl-0 ${
                i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:ml-auto md:pl-12'
              }`}
            >
              <span
                className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-sm font-semibold text-blue-600 md:top-1 ${
                  i % 2 === 0 ? 'md:left-auto md:-right-5' : 'md:-left-5'
                }`}
              >
                {i + 1}
              </span>
              <motion.div
                whileHover={reduce ? undefined : { y: -4 }}
                className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/10"
              >
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.body}</p>
              </motion.div>
            </motion.li>
          ))}
        </ol>
      </div>
    </motion.section>
  )
}

function BentoCard({ className = '', children, dark = false }: {
  className?: string
  children: ReactNode
  dark?: boolean
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      variants={fadeUp}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${
        dark
          ? 'border-slate-800 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-900 shadow-sm'
      } ${className}`}
    >
      {children}
    </motion.div>
  )
}

const CHECKS = ['Personalised guidance', 'Progress you can see', 'Built for tech roles']

export function WhySection() {
  const reduce = useReducedMotion()
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className="mx-auto max-w-6xl px-4 pb-28 sm:px-6"
    >
      <SectionHeading
        eyebrow="Why ur-career"
        title="Everything your career needs,"
        accent="in one place"
        subtitle="Stop juggling tabs and templates. Every tool shares the same goal: getting you hired."
      />

      <div className="grid gap-5 md:grid-cols-3">
        <BentoCard dark className="md:col-span-2">
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/40 blur-3xl" />
          <div className="relative">
            <h3 className="text-2xl font-semibold tracking-tight">An AI coach that knows tech</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
              Ask about career switches, skills gaps or salary expectations and get focused,
              actionable answers.
            </p>
            <div className="mt-6 space-y-2.5">
              {['What should I learn first as a backend developer?', 'Review my plan to become a data engineer.'].map(
                (text, i) => (
                  <motion.div
                    key={text}
                    initial={reduce ? false : { opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.25, duration: 0.6, ease: EASE }}
                    className={`w-fit max-w-full rounded-2xl px-4 py-2.5 text-sm ${
                      i === 0 ? 'bg-white/10 text-white' : 'ml-6 bg-blue-600 text-white'
                    }`}
                  >
                    {text}
                  </motion.div>
                ),
              )}
            </div>
          </div>
        </BentoCard>

        <BentoCard>
          <h3 className="text-lg font-semibold tracking-tight">Track every milestone</h3>
          <p className="mt-1.5 text-sm text-slate-500">See how far you've come on each roadmap.</p>
          <div className="mt-6 space-y-4">
            {[72, 45, 20].map((value, i) => (
              <div key={value}>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={reduce ? false : { width: 0 }}
                    whileInView={{ width: `${value}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 1, ease: EASE }}
                    className="h-full rounded-full bg-blue-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard>
          <h3 className="text-lg font-semibold tracking-tight">A CV that stands out</h3>
          <p className="mt-1.5 text-sm text-slate-500">Clean structure, clear impact.</p>
          <div className="mt-5 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="h-3 w-1/3 rounded bg-slate-900" />
            {[100, 85, 92, 60].map((w, i) => (
              <motion.div
                key={i}
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.7, ease: EASE }}
                style={{ width: `${w}%`, transformOrigin: 'left' }}
                className={`h-2 rounded ${i === 2 ? 'bg-blue-200' : 'bg-slate-200'}`}
              />
            ))}
          </div>
        </BentoCard>

        <BentoCard className="md:col-span-2">
          <h3 className="text-lg font-semibold tracking-tight">Designed around you</h3>
          <p className="mt-1.5 text-sm text-slate-500">
            Practice, learning and planning that adapt to where you are right now.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {CHECKS.map((text, i) => (
              <motion.li
                key={text}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: EASE }}
                className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                {text}
              </motion.li>
            ))}
          </ul>
        </BentoCard>
      </div>
    </motion.section>
  )
}

export function CtaBanner({ guest = false }: { guest?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: EASE }}
      className="mx-auto max-w-6xl px-4 pb-24 sm:px-6"
    >
      <div className="relative isolate overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 text-center sm:px-12">
        <motion.div
          aria-hidden="true"
          animate={reduce ? undefined : { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/60 blur-3xl"
        />
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Ready for your next <span className="text-blue-400">career move?</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-slate-300">
          Pick a roadmap, polish your CV, or just start a conversation. Every step counts.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <Link to={guest ? '/register' : '/consultation'} className="block rounded-xl bg-white px-6 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-blue-50">
              {guest ? 'Create your free account' : 'Start a consultation'}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <Link to={guest ? '/login' : '/cv-builder'} className="block rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10">
              {guest ? 'Sign in' : 'Build my CV'}
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

const FOOTER_LINKS = [
  { label: 'Consultation', to: '/consultation' },
  { label: 'CV Builder', to: '/cv-builder' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Practice', to: '/practice' },
]

export function HomeFooter() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <Link to="/" className="text-base font-bold tracking-tight">
          <span className="text-blue-600">ur</span>
          <span className="text-black">-career</span>
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-blue-600">
              {link.label}
            </Link>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} ur-career</p>
      </div>
    </footer>
  )
}
