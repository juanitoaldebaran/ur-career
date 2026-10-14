import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ROADMAP_CONTENT, getRoadmapStats } from '../data/roadmapContent'

const EASE = [0.22, 1, 0.36, 1] as const

const CAREERS: { slug: string; label: string }[] = [
  { slug: 'backend-software-engineer', label: 'Backend' },
  { slug: 'frontend-software-engineer', label: 'Frontend' },
  { slug: 'full-stack-engineer', label: 'Full Stack' },
  { slug: 'mobile-engineer', label: 'Mobile' },
  { slug: 'devops-engineer', label: 'DevOps' },
  { slug: 'cloud-computing', label: 'Cloud' },
  { slug: 'data-scientist', label: 'Data Science' },
  { slug: 'ai-engineer', label: 'AI' },
]

function SectionHead({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent: string; children?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
        {title} <span className="text-brand">{accent}</span>
      </h2>
      {children && <p className="mt-3 text-slate-500">{children}</p>}
    </div>
  )
}

/* A faux app window that shows what a roadmap feels like. */
const PREVIEW_TOPICS = [
  { title: 'HTTP/HTTPS', done: true },
  { title: 'Go', done: true },
  { title: 'Relational databases', done: true },
  { title: 'REST principles', done: false, active: true },
  { title: 'Caching basics (Redis)', done: false },
]

export function ProductPreview() {
  const reduce = useReducedMotion()
  return (
    <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative"
      >
        <div aria-hidden="true" className="absolute -inset-x-6 -bottom-6 top-10 -z-10 rounded-[2rem] bg-brand/10 blur-3xl" />
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-30px_rgba(10,14,26,0.35)]">
          <div className="flex items-center gap-1.5 border-b border-line bg-slate-50 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="ml-3 rounded-md bg-white px-3 py-0.5 font-mono text-[11px] text-slate-400">ur-career.app/roadmap/backend</span>
          </div>

          <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="eyebrow">Roadmap</p>
              <h3 className="mt-1 text-xl font-semibold">Backend Software Engineer</h3>
              <div className="mt-4">
                <div className="flex justify-between font-mono text-[11px] text-slate-400">
                  <span>3 / 5 topics</span>
                  <span>60%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '60%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.4, ease: EASE }}
                    className="h-full rounded-full bg-brand"
                  />
                </div>
              </div>
              <ul className="mt-5 space-y-2">
                {PREVIEW_TOPICS.map((topic, i) => (
                  <motion.li
                    key={topic.title}
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: EASE }}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${
                      topic.active ? 'border-brand ring-4 ring-brand/10' : 'border-line'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        topic.done ? 'border-green-600 bg-green-600' : topic.active ? 'border-brand bg-brand' : 'border-slate-300'
                      }`}
                    >
                      {topic.done && (
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 font-medium">{topic.title}</span>
                    <span className={`font-mono text-[10px] uppercase ${topic.done ? 'text-green-600' : topic.active ? 'text-brand' : 'text-slate-400'}`}>
                      {topic.done ? 'Done' : topic.active ? 'Learning' : 'Pending'}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden rounded-xl border border-line bg-slate-50/70 p-5 md:block"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Topic</p>
              <h4 className="mt-1 font-display text-lg font-semibold">REST principles</h4>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                Design APIs around resources, standard HTTP verbs, status codes and stateless requests.
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-slate-400">Resources · 2</p>
              <div className="mt-2 space-y-1.5">
                {['REST API tutorial', 'Google API design guide'].map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-medium">
                    {r}
                    <span className="text-slate-400">↗</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* Infinite strip of every language and framework we teach. */
export function TechMarquee() {
  const items = Array.from(
    new Set(Object.values(ROADMAP_CONTENT).flatMap((c) => [...c.languages, ...c.frameworks])),
  )
  const row = (suffix: string) =>
    items.map((name) => (
      <span key={name + suffix} className="mx-2 shrink-0 rounded-full border border-line bg-white px-4 py-1.5 font-mono text-xs text-slate-600">
        {name}
      </span>
    ))

  return (
    <section className="pb-24" aria-label="Languages and frameworks you will learn">
      <p className="eyebrow mb-6 text-center">Learn the stack companies hire for</p>
      <div className="marquee overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="marquee-track">
          {row('a')}
          <span aria-hidden="true" className="contents">
            {row('b')}
          </span>
        </div>
      </div>
    </section>
  )
}

export function StatsBand() {
  const slugs = Object.keys(ROADMAP_CONTENT)
  const totals = slugs.reduce(
    (acc, slug) => {
      const s = getRoadmapStats(slug)
      return { topics: acc.topics + s.topics, resources: acc.resources + s.resources }
    },
    { topics: 0, resources: 0 },
  )
  const stack = new Set(Object.values(ROADMAP_CONTENT).flatMap((c) => [...c.languages, ...c.frameworks, ...c.tools])).size

  const stats = [
    { value: slugs.length, label: 'Career roadmaps' },
    { value: totals.topics, label: 'Topics to master' },
    { value: totals.resources, label: 'Curated resources' },
    { value: stack, label: 'Tools & technologies' },
  ]

  return (
    <section className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
            className="bg-white px-6 py-8 text-center"
          >
            <p className="font-display text-4xl font-semibold">{s.value}</p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function CareerExplorer() {
  const [active, setActive] = useState(CAREERS[0].slug)
  const content = ROADMAP_CONTENT[active]
  const stats = getRoadmapStats(active)

  return (
    <section className="mx-auto max-w-5xl px-4 pb-28 sm:px-6">
      <SectionHead eyebrow="Careers" title="Pick a career," accent="see the stack">
        Eight roadmaps, each with the languages, frameworks and tools you will actually use.
      </SectionHead>

      <div role="tablist" aria-label="Careers" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
        {CAREERS.map((career) => {
          const selected = career.slug === active
          return (
            <button
              key={career.slug}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(career.slug)}
              className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selected ? 'text-white' : 'text-slate-500 hover:text-ink'
              }`}
            >
              {selected && (
                <motion.span layoutId="career-pill" className="absolute inset-0 -z-10 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
              )}
              {career.label}
            </button>
          )
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            role="tabpanel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="grid gap-8 md:grid-cols-[1fr_1.1fr]"
          >
            <div>
              <h3 className="text-2xl font-semibold">{content.tagline}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{content.description}</p>
              <div className="mt-6 flex gap-8 border-y border-line py-4">
                {[
                  { v: stats.topics, l: 'Topics' },
                  { v: stats.resources, l: 'Resources' },
                  { v: stats.skills, l: 'Skills' },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="font-display text-2xl font-semibold leading-none">{s.v}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">{s.l}</p>
                  </div>
                ))}
              </div>
              <Link to="/register" className="btn btn-primary mt-6">
                Start this roadmap →
              </Link>
            </div>

            <div className="space-y-5">
              {[
                { label: 'Languages', items: content.languages, chip: 'chip-ink' },
                { label: 'Frameworks & libraries', items: content.frameworks, chip: '' },
                { label: 'Tools & platforms', items: content.tools, chip: '' },
              ].map((group) => (
                <div key={group.label}>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{group.label}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.items.map((item, i) => (
                      <motion.span
                        key={item}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className={`chip ${group.chip}`}
                      >
                        {item}
                      </motion.span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

const FAQS = [
  { q: 'Is ur-career free?', a: 'You can create an account and follow every roadmap for free. Your progress is saved automatically.' },
  { q: 'Do I need experience to start?', a: 'No. Every roadmap begins with fundamentals and moves in order, so beginners and career switchers can follow along.' },
  { q: 'Where do the resources come from?', a: 'Each topic links to official documentation, free courses and well-regarded articles, chosen for clarity over hype.' },
  { q: 'Can I follow more than one roadmap?', a: 'Yes. Progress is tracked per topic, so you can mix paths, for example Frontend and Backend on the way to Full Stack.' },
  { q: 'What else is coming?', a: 'An AI consultation coach, a CV builder and interview practice are being built and will live alongside your roadmaps.' },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="mx-auto max-w-3xl px-4 pb-28 sm:px-6">
      <SectionHead eyebrow="FAQ" title="Questions," accent="answered" />
      <div className="divide-y divide-line rounded-2xl border border-line bg-white">
        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q}>
              <h3 className="!font-sans !tracking-normal">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold transition-colors hover:text-brand"
                >
                  {item.q}
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-xl leading-none text-slate-400">
                    +
                  </motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}
