import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import { getRoadmap, updateNodeStatus, type RoadmapNode } from '../lib/api'
import { ROADMAP_CONTENT, getRoadmapStats, type ResourceType } from '../data/roadmapContent'

const EASE = [0.22, 1, 0.36, 1] as const

const STATUS_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  pending: { dot: 'border-slate-300 bg-white', label: 'Pending', text: 'text-slate-400' },
  in_progress: { dot: 'bg-brand border-brand', label: 'In progress', text: 'text-brand' },
  done: { dot: 'bg-green-600 border-green-600', label: 'Done', text: 'text-green-600' },
}

const TYPE_LABELS: Record<ResourceType, string> = {
  docs: 'Docs',
  course: 'Course',
  video: 'Video',
  article: 'Article',
  practice: 'Practice',
  book: 'Book',
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}

export default function RoadmapDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { accessToken } = useAuth()
  const [nodes, setNodes] = useState<RoadmapNode[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const content = slug ? ROADMAP_CONTENT[slug] : undefined
  const stats = getRoadmapStats(slug ?? '')

  useEffect(() => {
    if (!accessToken || !slug) return
    getRoadmap(slug, accessToken)
      .then(setNodes)
      .catch(() => setError('Could not load this roadmap.'))
  }, [accessToken, slug])

  useEffect(() => {
    if (!selectedId) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setSelectedId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  const sections = useMemo(() => {
    if (!nodes) return []
    const roots = nodes.filter((n) => !n.parent_id).sort((a, b) => a.position - b.position)
    return roots.map((root) => ({
      root,
      stops: nodes.filter((n) => n.parent_id === root.id).sort((a, b) => a.position - b.position),
    }))
  }, [nodes])

  const leafNodes = useMemo(() => (nodes ?? []).filter((n) => n.parent_id), [nodes])
  const doneCount = leafNodes.filter((n) => n.status === 'done').length
  const progress = leafNodes.length ? Math.round((doneCount / leafNodes.length) * 100) : 0

  const selectedNode = nodes?.find((n) => n.id === selectedId) ?? null
  const selectedContent = selectedNode ? content?.topics[selectedNode.title] : undefined

  async function setStatus(node: RoadmapNode, status: string) {
    setNodes((prev) => (prev ? prev.map((n) => (n.id === node.id ? { ...n, status } : n)) : prev))
    if (accessToken) {
      await updateNodeStatus(node.id, status, accessToken).catch(() => {
        setNodes((prev) => (prev ? prev.map((n) => (n.id === node.id ? { ...n, status: node.status } : n)) : prev))
      })
    }
  }

  const title = slug?.replace(/-/g, ' ')

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <Link to="/roadmap" className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-brand">
        ← All roadmaps
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
        <p className="eyebrow mt-5">Roadmap</p>
        <h1 className="mt-2 text-4xl font-semibold capitalize sm:text-5xl">{title}</h1>
        {content && <p className="mt-3 max-w-2xl leading-relaxed text-slate-500">{content.description}</p>}

        {content && (
          <>
            <div className="mt-6 flex gap-10 border-y border-line py-5">
              {[
                { value: stats.topics, label: 'Topics' },
                { value: stats.resources, label: 'Resources' },
                { value: stats.skills, label: 'Skills' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-3xl font-semibold leading-none">{s.value}</p>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-8 text-lg font-semibold">What you will learn</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Languages', items: content.languages, chip: 'chip-ink' },
                { label: 'Frameworks & libraries', items: content.frameworks, chip: '' },
                { label: 'Tools & platforms', items: content.tools, chip: '' },
                { label: 'Core skills', items: content.skills, chip: 'chip-brand' },
              ].map((group, gi) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + gi * 0.08, duration: 0.5, ease: EASE }}
                  className={`rounded-2xl border border-line p-4 ${group.label === 'Core skills' ? 'sm:col-span-2' : ''}`}
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {group.label} · {group.items.length}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span key={item} className={`chip ${group.chip}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {nodes && (
        <div className="sticky top-20 z-10 mt-10 rounded-2xl border border-line bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">Your progress</span>
            <span className="text-slate-500">
              {doneCount} / {leafNodes.length} topics · {progress}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </div>
        </div>
      )}

      {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      {!error && !nodes && <p className="mt-8 text-sm text-slate-400">Loading…</p>}

      <div className="relative mt-10 pl-8">
        <div className="absolute bottom-0 left-[7px] top-2 w-px bg-slate-200" aria-hidden="true" />

        {sections.map(({ root, stops }, sectionIndex) => {
          const sectionDone = stops.filter((s) => s.status === 'done').length
          return (
            <motion.section
              key={root.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative mb-10"
            >
              <span
                className="absolute -left-8 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink font-mono text-[9px] font-bold text-white ring-4 ring-white"
                aria-hidden="true"
              >
                {sectionIndex + 1}
              </span>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold">{root.title}</h2>
                <span className="text-xs text-slate-400">
                  {sectionDone}/{stops.length}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {stops.map((stop) => {
                  const style = STATUS_STYLES[stop.status] ?? STATUS_STYLES.pending
                  const topicContent = content?.topics[stop.title]
                  return (
                    <li key={stop.id}>
                      <motion.button
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedId(stop.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm transition-colors hover:border-ink ${
                          selectedId === stop.id ? 'border-brand ring-4 ring-brand/10' : 'border-line'
                        }`}
                      >
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${style.dot}`} aria-hidden="true">
                          {stop.status === 'done' && (
                            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12.5l4.5 4.5L19 7.5" />
                            </svg>
                          )}
                        </span>
                        <span className="flex-1 font-medium text-slate-900">{stop.title}</span>
                        {topicContent && (
                          <span className="hidden text-xs text-slate-400 sm:inline">
                            {topicContent.resources.length} resources
                          </span>
                        )}
                        <span className={`w-16 text-right text-[10px] font-semibold uppercase tracking-wider ${style.text}`}>
                          {style.label}
                        </span>
                      </motion.button>
                    </li>
                  )
                })}
              </ul>
            </motion.section>
          )
        })}
      </div>

      <AnimatePresence>
        {selectedNode && (
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
              aria-label={selectedNode.title}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${(STATUS_STYLES[selectedNode.status] ?? STATUS_STYLES.pending).text}`}
                >
                  {(STATUS_STYLES[selectedNode.status] ?? STATUS_STYLES.pending).label}
                </span>
                <button
                  onClick={() => setSelectedId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                <motion.div key={selectedNode.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                  <h3 className="text-2xl font-semibold">{selectedNode.title}</h3>

                  {selectedContent ? (
                    <>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{selectedContent.summary}</p>

                      <h4 className="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Resources · {selectedContent.resources.length}
                      </h4>
                      <ul className="mt-3 space-y-2">
                        {selectedContent.resources.map((resource, i) => (
                          <motion.li
                            key={resource.url}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.07, duration: 0.35, ease: EASE }}
                          >
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm transition-colors hover:border-brand hover:bg-brand-soft"
                            >
                              <span className="flex-1 font-medium text-slate-900 group-hover:text-brand">{resource.title}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-500">
                                {TYPE_LABELS[resource.type]}
                              </span>
                              <span className="text-slate-400 transition-colors group-hover:text-brand">
                                <ExternalIcon />
                              </span>
                            </a>
                          </motion.li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">No description or resources for this topic yet.</p>
                  )}
                </motion.div>
              </div>

              <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
                {[
                  { status: 'in_progress', label: 'Learning', active: 'bg-brand text-white border-brand' },
                  { status: 'done', label: 'Done', active: 'bg-green-600 text-white border-green-600' },
                  { status: 'pending', label: 'Reset', active: 'bg-slate-100 text-slate-700 border-slate-200' },
                ].map((action) => (
                  <motion.button
                    key={action.status}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStatus(selectedNode, action.status)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedNode.status === action.status
                        ? action.active
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
