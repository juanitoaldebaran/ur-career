import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Conversation } from '../../lib/api'

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
      <li className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-line">
        <span className="truncate text-slate-600">Delete this chat?</span>
        <span className="flex shrink-0 gap-1">
          <button onClick={() => onDelete(conv.id)} className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
            Delete
          </button>
          <button onClick={() => setConfirming(false)} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
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
        className={`block truncate rounded-lg py-2 pl-3 pr-9 text-sm transition-colors ${
          active ? 'bg-brand-soft font-medium text-brand' : 'text-slate-700 hover:bg-white'
        }`}
      >
        {conv.title}
      </Link>
      <button
        onClick={() => setConfirming(true)}
        aria-label={`Delete conversation: ${conv.title}`}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-red-700 focus-visible:opacity-100 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        </svg>
      </button>
    </li>
  )
}

export default function HistoryPanel({
  conversations,
  loading,
  hasMore,
  onLoadMore,
  activeId,
  onDelete,
  onNew,
  onClose,
  onCollapse,
}: {
  conversations: Conversation[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  activeId?: string
  onDelete: (id: string) => void
  onNew: () => void
  onClose?: () => void
  onCollapse?: () => void // desktop: hides the panel back to the rail
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

  // Infinite scroll: load the next page when the end of the list is visible.
  useEffect(() => {
    const el = end.current
    if (!el || !hasMore || loading) return
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadMore(), { rootMargin: '80px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, conversations.length, onLoadMore])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-3">
        <button onClick={onNew} className="btn btn-ghost flex-1 justify-start bg-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Hide history"
            aria-label="Hide history"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-white hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            </svg>
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close history"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      <nav aria-label="Conversation history" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {groups.map(([label, list]) => (
          <section key={label} className="mt-4 first:mt-1">
            <h2 className="px-3 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</h2>
            <ul className="space-y-0.5">
              {list.map((c) => (
                <Item key={c.id} conv={c} active={c.id === activeId} onDelete={onDelete} onNavigate={() => onClose?.()} />
              ))}
            </ul>
          </section>
        ))}

        {loading && conversations.length === 0 && (
          <div className="space-y-2 px-3 pt-2" role="status" aria-label="Loading conversations">
            {[70, 55, 80, 45].map((w) => (
              <div key={w} className="h-4 animate-pulse rounded-full bg-line" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <p className="px-3 pt-3 text-sm leading-relaxed text-slate-500">No conversations yet. Ask your first question to start one.</p>
        )}

        <div ref={end} aria-hidden="true" className="h-1" />
      </nav>
    </div>
  )
}
