import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getRoadmap, updateNodeStatus, type RoadmapNode } from '../lib/api'

const STATUS_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  pending: { dot: 'bg-amber-400 border-amber-400', label: 'Pending', text: 'text-amber-600' },
  in_progress: { dot: 'bg-blue-600 border-blue-600', label: 'In progress', text: 'text-blue-600' },
  done: { dot: 'bg-green-600 border-green-600', label: 'Done', text: 'text-green-600' },
}

export default function RoadmapDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { accessToken } = useAuth()
  const [nodes, setNodes] = useState<RoadmapNode[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken || !slug) return
    getRoadmap(slug, accessToken)
      .then(setNodes)
      .catch(() => setError('Could not load this roadmap.'))
  }, [accessToken, slug])

  const sections = useMemo(() => {
    if (!nodes) return []
    const roots = nodes.filter((n) => !n.parent_id).sort((a, b) => a.position - b.position)
    return roots.map((root) => ({
      root,
      stops: nodes
        .filter((n) => n.parent_id === root.id)
        .sort((a, b) => a.position - b.position),
    }))
  }, [nodes])

  const progress = useMemo(() => {
    if (!nodes || nodes.length === 0) return 0
    const done = nodes.filter((n) => n.status === 'done').length
    return Math.round((done / nodes.length) * 100)
  }, [nodes])

  const selectedNode = nodes?.find((n) => n.id === selectedId) ?? null

  async function setStatus(node: RoadmapNode, status: string) {
    setNodes((prev) =>
      prev ? prev.map((n) => (n.id === node.id ? { ...n, status } : n)) : prev,
    )
    if (accessToken) {
      await updateNodeStatus(node.id, status, accessToken).catch(() => {
        setNodes((prev) =>
          prev ? prev.map((n) => (n.id === node.id ? { ...n, status: node.status } : n)) : prev,
        )
      })
    }
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">
        {slug?.replace(/-/g, ' ')}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your roadmap</h1>

      {nodes && (
        <div className="mt-5 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500">{progress}%</span>
        </div>
      )}

      {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      {!error && !nodes && <p className="mt-8 text-sm text-slate-400">Loading…</p>}

      <div className="relative mt-10 pl-6">
        <div className="absolute bottom-0 left-[3px] top-2 w-px bg-slate-200" aria-hidden="true" />

        {sections.map(({ root, stops }) => (
          <div key={root.id} className="relative mb-8">
            <span
              className="absolute -left-6 top-1 h-2 w-2 rounded-full bg-blue-600 ring-4 ring-white"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-slate-900">{root.title}</h2>

            <ul className="mt-3 space-y-1.5">
              {stops.map((stop) => {
                const style = STATUS_STYLES[stop.status] ?? STATUS_STYLES.pending
                return (
                  <li key={stop.id}>
                    <button
                      onClick={() => setSelectedId(stop.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                        selectedId === stop.id ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'
                      }`}
                    >
                      <span
                        className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${style.dot}`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-slate-900">{stop.title}</span>
                      <span className={`text-[10px] font-medium uppercase tracking-wider ${style.text}`}>
                        {style.label}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {selectedNode && (
        <>
          <div
            className="fixed inset-0 z-20 bg-slate-900/20"
            onClick={() => setSelectedId(null)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  (STATUS_STYLES[selectedNode.status] ?? STATUS_STYLES.pending).text
                }`}
              >
                {(STATUS_STYLES[selectedNode.status] ?? STATUS_STYLES.pending).label}
              </span>
              <button
                onClick={() => setSelectedId(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <h3 className="text-xl font-semibold text-slate-900">{selectedNode.title}</h3>
              <p className="mt-3 text-sm text-slate-500">
                No description yet for this topic — resource links and a write-up are coming soon.
              </p>
            </div>

            <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
              <button
                onClick={() => setStatus(selectedNode, 'in_progress')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  selectedNode.status === 'in_progress'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Learning
              </button>
              <button
                onClick={() => setStatus(selectedNode, 'done')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  selectedNode.status === 'done'
                    ? 'bg-green-600 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Done
              </button>
              <button
                onClick={() => setStatus(selectedNode, 'pending')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  selectedNode.status === 'pending'
                    ? 'bg-amber-400 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Reset
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
