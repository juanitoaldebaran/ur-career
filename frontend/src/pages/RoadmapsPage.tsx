import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { listRoadmaps, type RoadmapSummary } from '../lib/api'

export default function RoadmapsPage() {
  const { accessToken } = useAuth()
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

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

      {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      {!error && !roadmaps && <p className="mt-8 text-sm text-slate-400">Loading…</p>}
      {roadmaps && roadmaps.length === 0 && (
        <p className="mt-8 text-sm text-slate-400">No roadmaps yet.</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {roadmaps?.map((roadmap, i) => (
          <Link
            key={roadmap.id}
            to={`/roadmap/${roadmap.slug}`}
            className="rise-in group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            style={{ animationDelay: `${i * 60}ms` }}
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
        ))}
      </div>
    </div>
  )
}
