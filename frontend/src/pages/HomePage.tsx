import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import TypingWord from '../components/TypingWord'
import { CtaBanner, HomeFooter, HowItWorks, WhySection } from '../components/HomeSections'

const GREETING_PREFIX = 'Welcome back, '
const EASE = [0.22, 1, 0.36, 1] as const

interface Feature {
  title: string
  description: string
  to: string
  icon: ReactNode
}

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'h-6 w-6',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const FEATURES: Feature[] = [
  {
    title: 'Consultation',
    description: 'Talk through your goals with an AI coach that understands the tech industry.',
    to: '/consultation',
    icon: (
      <svg {...iconProps}>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      </svg>
    ),
  },
  {
    title: 'CV Builder',
    description: 'Craft a sharp, recruiter-ready resume with guided, structured sections.',
    to: '/cv-builder',
    icon: (
      <svg {...iconProps}>
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5M10 13h6M10 17h6" />
      </svg>
    ),
  },
  {
    title: 'Roadmaps',
    description: 'Follow curated learning paths and track your progress step by step.',
    to: '/roadmap',
    icon: (
      <svg {...iconProps}>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6" />
      </svg>
    ),
  },
  {
    title: 'Practice',
    description: 'Sharpen your skills with interview-style challenges and instant feedback.',
    to: '/practice',
    icon: (
      <svg {...iconProps}>
        <path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14" />
      </svg>
    ),
  },
]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const px = useMotionValue(0)
  const py = useMotionValue(0)

  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 })
  const spotlight = useMotionTemplate`radial-gradient(260px circle at ${px}px ${py}px, rgba(37,99,235,0.14), transparent 70%)`

  function handleMove(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    px.set(event.clientX - rect.left)
    py.set(event.clientY - rect.top)
    x.set((event.clientX - rect.left) / rect.width)
    y.set((event.clientY - rect.top) / rect.height)
  }

  function handleLeave() {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      variants={item}
      style={{ perspective: 900 }}
      className="h-full"
    >
      <motion.div
        onMouseMove={reduce ? undefined : handleMove}
        onMouseLeave={reduce ? undefined : handleLeave}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={reduce ? undefined : { y: -6 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/10"
      >
        <motion.div
          aria-hidden="true"
          style={{ background: spotlight }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <Link to={feature.to} className="relative flex h-full flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white transition-colors duration-300 group-hover:bg-blue-600">
              {feature.icon}
            </span>
            <span className="text-xs font-medium tabular-nums text-slate-300">
              0{index + 1}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              {feature.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              {feature.description}
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-blue-600">
            Open
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
      </motion.div>
    </motion.div>
  )
}

interface Cta {
  label: string
  to: string
}

interface HeroProps {
  headline: ReactNode
  primary: Cta
  secondary: Cta
}

function Hero({ headline, primary, secondary }: HeroProps) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20 })
  const sy = useSpring(my, { stiffness: 60, damping: 20 })
  const orbAx = useTransform(sx, (v) => v * -0.04)
  const orbAy = useTransform(sy, (v) => v * -0.04)
  const orbBx = useTransform(sx, (v) => v * 0.06)
  const orbBy = useTransform(sy, (v) => v * 0.06)

  const { scrollY } = useScroll()
  const fade = useTransform(scrollY, [0, 400], [1, 0])
  const lift = useTransform(scrollY, [0, 400], [0, -40])

  function handleMove(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    mx.set(event.clientX - rect.left - rect.width / 2)
    my.set(event.clientY - rect.top - rect.height / 2)
  }

  return (
    <section
      onMouseMove={reduce ? undefined : handleMove}
      className="relative isolate flex min-h-[70svh] flex-col items-center justify-center overflow-hidden px-4 text-center"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <motion.div
        aria-hidden="true"
        style={{ x: orbAx, y: orbAy }}
        className="absolute -left-24 top-10 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
        animate={reduce ? undefined : { scale: [1, 1.15, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        style={{ x: orbBx, y: orbBy }}
        className="absolute -right-24 bottom-0 -z-10 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl"
        animate={reduce ? undefined : { scale: [1.1, 0.95, 1.1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div style={reduce ? undefined : { opacity: fade, y: lift }}>
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
          </span>
          Your AI Tech Career Coach
        </motion.span>

        <h1 className="mt-6 min-h-[1.2em] text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {headline}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg"
        >
          Plan your path, build your CV, and practice for the roles you want — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to={primary.to}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-blue-600"
            >
              {primary.label}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to={secondary.to}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-900 transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              {secondary.label}
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export function HomeContent({ guest = false }: { guest?: boolean }) {
  const { user } = useAuth()
  const username = user?.email.split('@')[0] ?? ''
  const fullText = username ? `${GREETING_PREFIX}${username}` : ''

  return (
    <div className="-mt-24 pt-24">
      <Hero
        headline={
          guest ? (
            <>
              Your Best AI<span className="text-blue-600"> Tech Career Coach</span>
            </>
          ) : (
            <TypingWord text={fullText} highlightFrom={GREETING_PREFIX.length} />
          )
        }
        primary={guest ? { label: 'Get started free', to: '/register' } : { label: 'Start a consultation', to: '/consultation' }}
        secondary={guest ? { label: 'Sign in', to: '/login' } : { label: 'Explore roadmaps', to: '/roadmap' }}
      />

      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="mx-auto max-w-6xl px-4 pb-24 sm:px-6"
      >
        <motion.div variants={item} className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Where to next<span className="text-blue-600">?</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {guest ? 'Everything you need to land your next role.' : 'Pick up right where you left off.'}
            </p>
          </div>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.to} feature={feature} index={index} />
          ))}
        </div>
      </motion.section>

      <HowItWorks />
      <WhySection />
      <CtaBanner guest={guest} />
      <HomeFooter />
    </div>
  )
}

export default function HomePage() {
  return <HomeContent />
}
