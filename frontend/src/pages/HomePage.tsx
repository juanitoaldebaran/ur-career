import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import TypingWord from '../components/TypingWord'
import { CtaBanner, HomeFooter, HowItWorks, WhySection } from '../components/HomeSections'
import { CareerExplorer, Faq, ProductPreview, StatsBand, TechMarquee } from '../components/LandingSections'

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
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div variants={item} className="h-full">
      <motion.div whileHover={reduce ? undefined : { y: -2 }} transition={{ duration: 0.2 }} className="h-full">
        <Link
          to={feature.to}
          className="group flex h-full flex-col gap-5 rounded-2xl border border-line bg-white p-6 transition-colors duration-200 hover:border-brand"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white">
              {feature.icon}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-slate-400">0{index + 1}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink">{feature.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{feature.description}</p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            Open
            <Arrow className="transition-transform duration-200 group-hover:translate-x-1" />
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
  eyebrow: string
  headline: ReactNode
  lead: string
  primary: Cta
  secondary: Cta
}

function Hero({ eyebrow, headline, lead, primary, secondary }: HeroProps) {
  return (
    <section className="relative border-b border-line bg-white">
      <div className="mx-auto flex min-h-[64svh] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="eyebrow"
        >
          {eyebrow}
        </motion.p>

        <h1 className="mt-4 min-h-[1.1em] max-w-3xl text-4xl font-semibold leading-[1.05] text-balance text-ink sm:text-6xl">
          {headline}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
        >
          {lead}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          className="mt-9 flex flex-col gap-3 sm:flex-row"
        >
          <Link to={primary.to} className="btn btn-primary group px-6 py-3">
            {primary.label}
            <Arrow className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link to={secondary.to} className="btn btn-ghost px-6 py-3">
            {secondary.label}
          </Link>
        </motion.div>
      </div>
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
        eyebrow={guest ? 'AI career coach for tech' : 'Your workspace'}
        headline={
          guest ? (
            <>
              Plan your tech career<span className="text-brand">, step by step.</span>
            </>
          ) : (
            <TypingWord text={fullText} highlightFrom={GREETING_PREFIX.length} />
          )
        }
        lead={
          guest
            ? 'Pick a roadmap, build your CV and practise interviews for the role you want, with an AI coach that knows the industry.'
            : 'Pick up where you left off: continue a roadmap, refine your CV or practise for your next interview.'
        }
        primary={guest ? { label: 'Start now', to: '/register' } : { label: 'Start a consultation', to: '/consultation' }}
        secondary={guest ? { label: 'Sign in', to: '/login' } : { label: 'Explore roadmaps', to: '/roadmap' }}
      />

      {guest && (
        <div className="pt-16">
          <ProductPreview />
        </div>
      )}
      {guest && <TechMarquee />}

      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6"
      >
        <motion.div variants={item} className="mb-8">
          <p className="eyebrow">{guest ? 'What you get' : 'Jump back in'}</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">
            {guest ? 'Four tools, one goal: your next role' : 'Where to next?'}
          </h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.to} feature={feature} index={index} />
          ))}
        </div>
      </motion.section>

      {guest && <CareerExplorer />}
      <HowItWorks />
      <WhySection />
      <StatsBand />
      <Faq />
      <CtaBanner guest={guest} />
      <HomeFooter />
    </div>
  )
}

export default function HomePage() {
  return <HomeContent />
}
