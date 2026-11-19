import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Conversation } from '../../lib/api'
import { Icon } from './icons'

function bucket(iso: string): string {
  const d = new Date(iso)
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days <= 7) return 'Previous 7 days'
  return 'Older'
}

function Item({
  conv,
  active,
  onDelete,
  onNavigate,
}: {
  conv: Conversation
  active: boolean
  onDelete: (id: string) => void
  onNavigate: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <li className="flex items-center justify-between gap-2 rounded-2xl bg-white px-4 py-2 text-sm">
        <span className="truncate text-slate-600">Delete this chat?</span>
        <span className="flex shrink-0 gap-1">
          <button onClick={() => onDelete(conv.id)} className="rounded-full px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
            Delete
          </button>
          <button onClick={() => setConfirming(false)} className="rounded-full px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-rail">
            Cancel
          </button>
        </span>
      </li>
    )
  }

  return (
    <li className="group relative">
      <Link
        to={`/consultation/${conv.id}`}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={`block truncate rounded-full py-2 pl-4 pr-11 text-sm transition-colors duration-150 ${
          active ? 'bg-rail-active font-medium text-blue-700' : 'text-slate-700 hover:bg-rail-hover hover:text-ink'
        }`}
      >
        {conv.title}
      </Link>
      <button
        onClick={() => setConfirming(true)}
        aria-label={`Delete conversation: ${conv.title}`}
        title="Delete"
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-red-700 focus-visible:opacity-100 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
      >
        <Icon name="trash" className="h-4 w-4" />
      </button>
    </li>
  )
}

// The "Recent" list: conversations grouped by day, with infinite scroll.
export default function HistoryPanel({
  conversations,
  loading,
  hasMore,
  onLoadMore,
  activeId,
  onDelete,
  onNavigate,
}: {
  conversations: Conversation[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  activeId?: string
  onDelete: (id: string) => void
  onNavigate: () => void
}) {
  const end = useRef<HTMLDivElement>(null)

  const groups = useMemo(() => {
    const map = new Map<string, Conversation[]>()
    for (const c of conversations) {
      const key = bucket(c.updated_at)
      map.set(key, [...(map.get(key) ?? []), c])
    }
    return [...map.entries()]
  }, [conversations])

  useEffect(() => {
    const el = end.current
    if (!el || !hasMore || loading) return
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadMore(), { rootMargin: '80px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, conversations.length, onLoadMore])

  return (
    <nav aria-label="Recent conversations">
      {groups.map(([label, list]) => (
        <section key={label} className="mt-4 first:mt-1">
          <h2 className="px-4 pb-1.5 text-xs font-medium text-slate-600">{label}</h2>
          <ul className="space-y-0.5">
            {list.map((c) => (
              <Item key={c.id} conv={c} active={c.id === activeId} onDelete={onDelete} onNavigate={onNavigate} />
            ))}
          </ul>
        </section>
      ))}

      {loading && conversations.length === 0 && (
        <div className="space-y-2.5 px-4 pt-2" role="status" aria-label="Loading conversations">
          {[70, 55, 80, 45].map((w) => (
            <div key={w} className="h-4 animate-pulse rounded-full bg-rail-hover" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <p className="px-4 pt-2 text-sm leading-relaxed text-slate-600">No conversations yet. Ask your first question to start one.</p>
      )}

      <div ref={end} aria-hidden="true" className="h-1" />
    </nav>
  )
}
