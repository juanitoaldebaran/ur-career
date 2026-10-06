import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import { listRoadmaps, type RoadmapSummary } from '../lib/api'

export default function RoadmapsPage() {
  const { accessToken } = useAuth()
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!roadmaps || !term) return roadmaps
    return roadmaps.filter(
      (roadmap) =>
        roadmap.title.toLowerCase().includes(term) || roadmap.slug.toLowerCase().includes(term),
    )
  }, [roadmaps, query])

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

  useEffect(() => {
    if (!accessToken) return
    listRoadmaps(accessToken)
      .then(setRoadmaps)
      .catch(() => setError('Could not load roadmaps.'))
  }, [accessToken])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">Roadmaps</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Pick a roadmap</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-500">
        A structured path of topics to work through, in order. Your progress is saved as you go.
      </p>

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
          placeholder="Search roadmaps…"
          aria-label="Search roadmaps"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-16 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10 [&::-webkit-search-cancel-button]:hidden"
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
      {roadmaps && roadmaps.length === 0 && (
        <p className="mt-8 text-sm text-slate-400">No roadmaps yet.</p>
      )}

      {roadmaps && roadmaps.length > 0 && filtered?.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">
          No roadmaps match “{query.trim()}”.
        </p>
      )}

      <motion.div layout className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
        {filtered?.map((roadmap, i) => (
          <motion.div
            key={roadmap.id}
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: query ? 0 : i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
          <Link
            to={`/roadmap/${roadmap.slug}`}
            className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                {roadmap.title}
              </h2>
              <p className="mt-1 text-xs text-slate-400">{roadmap.node_count} topics</p>
            </div>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition group-hover:bg-blue-600"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
          </motion.div>
        ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
