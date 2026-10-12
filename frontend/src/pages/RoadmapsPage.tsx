import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import { listRoadmaps, type RoadmapSummary } from '../lib/api'
import { ROADMAP_CONTENT, getRoadmapStats } from '../data/roadmapContent'

const EASE = [0.22, 1, 0.36, 1] as const
const ORDER = Object.keys(ROADMAP_CONTENT)
const MAX_FRAMEWORKS = 4

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}

function ChipGroup({ label, items, variant, max }: { label: string; items: string[]; variant: string; max?: number }) {
  const shown = max ? items.slice(0, max) : items
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {shown.map((item) => (
          <span key={item} className={`chip ${variant}`}>
            {item}
          </span>
        ))}
        {max && items.length > max && <span className="chip chip-brand">+{items.length - max}</span>}
      </div>
    </div>
  )
}

function RoadmapCard({ roadmap, index, instant }: { roadmap: RoadmapSummary; index: number; instant: boolean }) {
  const content = ROADMAP_CONTENT[roadmap.slug]
  const stats = getRoadmapStats(roadmap.slug)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: instant ? 0 : index * 0.06, ease: EASE }}
    >
      <Link
        to={`/roadmap/${roadmap.slug}`}
        className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-[0_18px_40px_-20px_rgba(10,14,26,0.35)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold">{roadmap.title}</h2>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-all duration-300 group-hover:border-brand group-hover:bg-brand group-hover:text-white"
            aria-hidden="true"
          >
            →
          </span>
        </div>

        {content && <p className="mt-2 text-sm leading-relaxed text-slate-500">{content.tagline}</p>}

        <div className="mt-5 flex gap-8 border-y border-line py-4">
          <Stat value={roadmap.node_count} label="Topics" />
          <Stat value={stats.resources} label="Resources" />
          <Stat value={stats.skills} label="Skills" />
        </div>

        {content && (
          <div className="mt-4 space-y-3.5">
            <ChipGroup label="Languages" items={content.languages} variant="chip-ink" />
            <ChipGroup label="Frameworks" items={content.frameworks} variant="" max={MAX_FRAMEWORKS} />
          </div>
        )}
      </Link>
    </motion.div>
  )
}

export default function RoadmapsPage() {
  const { accessToken } = useAuth()
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sorted = useMemo(() => {
    if (!roadmaps) return null
    const rank = (slug: string) => {
      const i = ORDER.indexOf(slug)
      return i === -1 ? ORDER.length : i
    }
    return [...roadmaps].sort((a, b) => rank(a.slug) - rank(b.slug))
  }, [roadmaps])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!sorted || !term) return sorted
    return sorted.filter((roadmap) => {
      const c = ROADMAP_CONTENT[roadmap.slug]
      const skills = c ? [...c.skills, ...c.languages, ...c.frameworks, ...c.tools].join(' ') : ''
      return `${roadmap.title} ${roadmap.slug} ${skills}`.toLowerCase().includes(term)
    })
  }, [sorted, query])

  useEffect(() => {
    if (!accessToken) return
    listRoadmaps(accessToken)
      .then(setRoadmaps)
      .catch(() => setError('Could not load roadmaps.'))
  }, [accessToken])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (event.key === '/' && !typing) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
        <p className="eyebrow">Roadmaps</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          Pick a path, <span className="text-brand">learn in order</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-500">
          Every roadmap lists the languages and frameworks you will learn, plus a short explanation and hand-picked resources for each topic.
        </p>
      </motion.div>

      <div className="relative mt-6 max-w-md">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === 'Escape' && setQuery('')}
          placeholder="Search roadmaps or skills…"
          aria-label="Search roadmaps"
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-16 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10 [&::-webkit-search-cancel-button]:hidden"
        />
        <AnimatePresence mode="wait" initial={false}>
          {query ? (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.12 }}
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </motion.button>
          ) : (
            <motion.kbd
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-400 sm:block"
            >
              /
            </motion.kbd>
          )}
        </AnimatePresence>
      </div>
      {roadmaps && query.trim() && (
        <p className="mt-2 text-xs text-slate-400" aria-live="polite">
          {filtered?.length ?? 0} of {roadmaps.length} roadmaps
        </p>
      )}

      {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      {!error && !roadmaps && <p className="mt-8 text-sm text-slate-400">Loading…</p>}
      {roadmaps && roadmaps.length === 0 && <p className="mt-8 text-sm text-slate-400">No roadmaps yet.</p>}
      {roadmaps && roadmaps.length > 0 && filtered?.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">No roadmaps match “{query.trim()}”.</p>
      )}

      <motion.div layout className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered?.map((roadmap, i) => (
            <RoadmapCard key={roadmap.id} roadmap={roadmap} index={i} instant={query.trim() !== ''} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
