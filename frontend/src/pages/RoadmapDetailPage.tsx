import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import { getRoadmap, updateNodeStatus, type RoadmapNode } from '../lib/api'
import { ROADMAP_CONTENT, getRoadmapStats, type Resource, type ResourceType } from '../data/roadmapContent'

const EASE = [0.22, 1, 0.36, 1] as const

type Status = 'pending' | 'in_progress' | 'done'
type Filter = 'all' | Status

const STATUS: Record<Status, { label: string; text: string; soft: string }> = {
  pending: { label: 'To do', text: 'text-slate-400', soft: 'bg-slate-100 text-slate-500' },
  in_progress: { label: 'Learning', text: 'text-brand', soft: 'bg-brand-soft text-brand' },
  done: { label: 'Done', text: 'text-emerald-600', soft: 'bg-emerald-50 text-emerald-700' },
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'To do' },
  { id: 'in_progress', label: 'Learning' },
  { id: 'done', label: 'Done' },
]

const TYPE_META: Record<ResourceType, { label: string; badge: string }> = {
  docs: { label: 'Docs', badge: 'bg-sky-50 text-sky-700' },
  course: { label: 'Courses', badge: 'bg-violet-50 text-violet-700' },
  video: { label: 'Videos', badge: 'bg-rose-50 text-rose-700' },
  article: { label: 'Articles', badge: 'bg-amber-50 text-amber-700' },
  practice: { label: 'Practice', badge: 'bg-emerald-50 text-emerald-700' },
  book: { label: 'Books', badge: 'bg-orange-50 text-orange-700' },
}

const asStatus = (value: string): Status => (value in STATUS ? (value as Status) : 'pending')

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function Icon({ d, className = 'h-4 w-4' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const ICON = {
  external: 'M7 17 17 7M8 7h9v9',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
}

function StatusDot({ status, size = 'h-5 w-5' }: { status: Status; size?: string }) {
  if (status === 'done') {
    return (
      <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white`}>
        <Icon d={ICON.check} className="h-3 w-3" />
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className={`relative flex ${size} shrink-0 items-center justify-center rounded-full border-2 border-brand bg-white`}>
        <span className="h-2 w-2 rounded-full bg-brand" />
      </span>
    )
  }
  return <span className={`${size} shrink-0 rounded-full border-2 border-slate-200 bg-white`} />
}

function ProgressRing({ percent, size = 96 }: { percent: number; size?: number }) {
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${percent}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - percent / 100) }}
          transition={{ duration: 0.8, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold leading-none">{percent}%</span>
      </div>
    </div>
  )
}

interface Stop {
  node: RoadmapNode
  section: string
  sectionIndex: number
}

export default function RoadmapDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { accessToken } = useAuth()
  const [nodes, setNodes] = useState<RoadmapNode[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [showStack, setShowStack] = useState(false)

  const content = slug ? ROADMAP_CONTENT[slug] : undefined
  const stats = getRoadmapStats(slug ?? '')

  useEffect(() => {
    if (!accessToken || !slug) return
    getRoadmap(slug, accessToken)
      .then(setNodes)
      .catch(() => setError('Could not load this roadmap.'))
  }, [accessToken, slug])

  const sections = useMemo(() => {
    if (!nodes) return []
    const roots = nodes.filter((n) => !n.parent_id).sort((a, b) => a.position - b.position)
    return roots.map((root, index) => ({
      root,
      index,
      stops: nodes.filter((n) => n.parent_id === root.id).sort((a, b) => a.position - b.position),
    }))
  }, [nodes])

  const ordered: Stop[] = useMemo(
    () => sections.flatMap((s) => s.stops.map((node) => ({ node, section: s.root.title, sectionIndex: s.index }))),
    [sections],
  )

  const total = ordered.length
  const counts = useMemo(() => {
    const c = { pending: 0, in_progress: 0, done: 0 }
    ordered.forEach((s) => (c[asStatus(s.node.status)] += 1))
    return c
  }, [ordered])
  const progress = total ? Math.round((counts.done / total) * 100) : 0

  const selectedIndex = ordered.findIndex((s) => s.node.id === selectedId)
  const selected = selectedIndex >= 0 ? ordered[selectedIndex] : null
  const selectedContent = selected ? content?.topics[selected.node.title] : undefined
  const nextUp = ordered.find((s) => s.node.status !== 'done') ?? null

  const go = useCallback(
    (delta: number) => {
      const target = ordered[selectedIndex + delta]
      if (target) setSelectedId(target.node.id)
    },
    [ordered, selectedIndex],
  )

  useEffect(() => {
    if (!selectedId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, go])

  async function setStatus(node: RoadmapNode, status: Status) {
    const previous = node.status
    setNodes((prev) => (prev ? prev.map((n) => (n.id === node.id ? { ...n, status } : n)) : prev))
    if (accessToken) {
      await updateNodeStatus(node.id, status, accessToken).catch(() => {
        setNodes((prev) => (prev ? prev.map((n) => (n.id === node.id ? { ...n, status: previous } : n)) : prev))
      })
    }
  }

  const title = slug?.replace(/-/g, ' ')

  const stackGroups = content
    ? [
        { label: 'Languages', items: content.languages, chip: 'chip-ink' },
        { label: 'Frameworks', items: content.frameworks, chip: '' },
        { label: 'Tools', items: content.tools, chip: '' },
        { label: 'Core skills', items: content.skills, chip: 'chip-brand' },
      ]
    : []

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <Link to="/roadmap" className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-brand">
        <Icon d={ICON.left} className="h-3.5 w-3.5" /> All roadmaps
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mt-5 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-soft via-white to-white p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="eyebrow">Roadmap</p>
            <h1 className="mt-2 text-3xl font-semibold capitalize sm:text-5xl">{title}</h1>
            {content && <p className="mt-3 max-w-xl leading-relaxed text-slate-600">{content.description}</p>}
          </div>
          {nodes && <ProgressRing percent={progress} />}
        </div>

        {content && (
          <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">
            {[
              { value: stats.topics, label: 'Topics' },
              { value: stats.resources, label: 'Resources' },
              { value: stats.skills, label: 'Skills' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-white/80 px-4 py-3">
                <p className="font-display text-2xl font-semibold leading-none">{s.value}</p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {nodes && total > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {nextUp ? (
              <button onClick={() => setSelectedId(nextUp.node.id)} className="btn btn-primary">
                {counts.done === 0 && counts.in_progress === 0 ? 'Start learning' : 'Continue'}: {nextUp.node.title}
                <Icon d={ICON.arrow} />
              </button>
            ) : (
              <span className="chip chip-brand">Roadmap complete. Great work.</span>
            )}
          </div>
        )}

        {content && (
          <div className="mt-6 border-t border-line pt-4">
            <button
              onClick={() => setShowStack((v) => !v)}
              className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-700"
              aria-expanded={showStack}
            >
              Tech stack you will touch
              <span className="text-xs text-slate-400">{showStack ? 'Hide' : 'Show'}</span>
            </button>
            <AnimatePresence initial={false}>
              {showStack && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3">
                    {stackGroups.map((g) => (
                      <div key={g.label}>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                          {g.label} · {g.items.length}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {g.items.map((item) => (
                            <span key={item} className={`chip ${g.chip}`}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Sticky toolbar: segmented progress + filters */}
      {nodes && total > 0 && (
        <div className="sticky top-20 z-10 mt-8 rounded-2xl border border-line bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-700">
              {counts.done} of {total} done
              {counts.in_progress > 0 && <span className="text-brand"> · {counts.in_progress} in progress</span>}
            </span>
            <div className="flex gap-1" role="tablist" aria-label="Filter topics">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                    filter === f.id ? 'bg-ink text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                  <span className="ml-1 opacity-60">{f.id === 'all' ? total : counts[f.id]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <motion.div className="h-full bg-emerald-500" initial={false} animate={{ width: `${(counts.done / total) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} />
            <motion.div className="h-full bg-brand/60" initial={false} animate={{ width: `${(counts.in_progress / total) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} />
          </div>
        </div>
      )}

      {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      {!error && !nodes && (
        <div className="mt-8 space-y-3" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* Path */}
      <div className="relative mt-8">
        {sections.map(({ root, index, stops }) => {
          const done = stops.filter((s) => s.status === 'done').length
          const sectionPct = stops.length ? (done / stops.length) * 100 : 0
          const visible = stops.filter((s) => filter === 'all' || asStatus(s.status) === filter)
          if (visible.length === 0) return null
          const complete = done === stops.length && stops.length > 0
          const isLast = index === sections.length - 1

          return (
            <motion.section
              key={root.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative min-w-0 pb-8 pl-12"
            >
              {!isLast && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-line" aria-hidden="true" />}
              <span
                className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold ring-4 ring-white ${
                  complete ? 'bg-emerald-500 text-white' : 'bg-ink text-white'
                }`}
                aria-hidden="true"
              >
                {complete ? <Icon d={ICON.check} className="h-4 w-4" /> : index + 1}
              </span>

              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold leading-8">{root.title}</h2>
                <span className="shrink-0 font-mono text-[11px] text-slate-400">
                  {done}/{stops.length}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: 0 }} whileInView={{ width: `${sectionPct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }} />
              </div>

              <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2">
                {visible.map((stop) => {
                  const status = asStatus(stop.status)
                  const topic = content?.topics[stop.title]
                  const active = selectedId === stop.id
                  return (
                    <li key={stop.id} className="min-w-0">
                      <motion.button
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedId(stop.id)}
                        className={`group flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors hover:border-ink ${
                          active ? 'border-brand ring-4 ring-brand/10' : 'border-line'
                        } ${status === 'done' ? 'bg-slate-50/60' : ''}`}
                      >
                        <StatusDot status={status} />
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-medium ${status === 'done' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
                            {stop.title}
                          </span>
                          {topic && <span className="mt-0.5 block truncate text-xs text-slate-400">{topic.summary}</span>}
                        </span>
                        {topic && (
                          <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500 sm:inline">
                            {topic.resources.length} res
                          </span>
                        )}
                        <span className={`hidden w-16 shrink-0 text-right text-[10px] font-semibold uppercase tracking-wider sm:inline ${STATUS[status].text}`}>
                          {STATUS[status].label}
                        </span>
                        <Icon d={ICON.right} className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-ink" />
                      </motion.button>
                    </li>
                  )
                })}
              </ul>
            </motion.section>
          )
        })}
        {nodes && total > 0 && filter !== 'all' && counts[filter] === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-slate-400">
            Nothing here yet. Pick another filter.
          </p>
        )}
      </div>

      {/* Topic panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 bg-ink/25 backdrop-blur-[2px]"
              onClick={() => setSelectedId(null)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 36 }}
              className="fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-line bg-white shadow-2xl"
              aria-label={selected.node.title}
            >
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  {selected.sectionIndex + 1}. {selected.section}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="mr-1 font-mono text-[11px] text-slate-400">
                    {selectedIndex + 1}/{total}
                  </span>
                  <button onClick={() => go(-1)} disabled={selectedIndex === 0} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30" aria-label="Previous topic">
                    <Icon d={ICON.left} />
                  </button>
                  <button onClick={() => go(1)} disabled={selectedIndex === total - 1} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30" aria-label="Next topic">
                    <Icon d={ICON.right} />
                  </button>
                  <button onClick={() => setSelectedId(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
                    <Icon d={ICON.close} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                <motion.div key={selected.node.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS[asStatus(selected.node.status)].soft}`}>
                    <StatusDot status={asStatus(selected.node.status)} size="h-3.5 w-3.5" />
                    {STATUS[asStatus(selected.node.status)].label}
                  </span>
                  <h3 className="mt-3 text-2xl font-semibold leading-tight">{selected.node.title}</h3>

                  {selectedContent ? (
                    <>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{selectedContent.summary}</p>
                      <ResourceGroups resources={selectedContent.resources} />
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">No description or resources for this topic yet.</p>
                  )}

                  <Link
                    to="/practice"
                    className="mt-8 flex items-center justify-between rounded-2xl border border-line bg-brand-soft/60 px-4 py-3 text-sm transition-colors hover:border-brand"
                  >
                    <span>
                      <span className="block font-medium text-slate-900">Test what you learned</span>
                      <span className="block text-xs text-slate-500">Take a practice quiz for this role</span>
                    </span>
                    <Icon d={ICON.arrow} className="h-4 w-4 text-brand" />
                  </Link>
                </motion.div>
              </div>

              <div className="border-t border-line px-5 py-4">
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Set status">
                  {(['pending', 'in_progress', 'done'] as const).map((s) => {
                    const on = asStatus(selected.node.status) === s
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(selected.node, s)}
                        aria-pressed={on}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          on
                            ? s === 'done'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : s === 'in_progress'
                                ? 'bg-brand text-white shadow-sm'
                                : 'bg-white text-slate-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {STATUS[s].label}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-400">Use the ← → keys to move between topics</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ResourceGroups({ resources }: { resources: Resource[] }) {
  const groups = (Object.keys(TYPE_META) as ResourceType[])
    .map((type) => ({ type, items: resources.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="mt-8">
      <h4 className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Resources · {resources.length}</h4>
      <div className="mt-3 space-y-5">
        {groups.map((group) => (
          <div key={group.type}>
            <p className="mb-2 text-xs font-semibold text-slate-700">{TYPE_META[group.type].label}</p>
            <ul className="space-y-2">
              {group.items.map((resource) => (
                <li key={resource.url}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:border-brand hover:bg-brand-soft"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900 group-hover:text-brand">{resource.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-400">{hostOf(resource.url)}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${TYPE_META[group.type].badge}`}>
                      {group.type}
                    </span>
                    <span className="text-slate-300 transition-colors group-hover:text-brand">
                      <Icon d={ICON.external} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
