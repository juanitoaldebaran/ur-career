import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Phase, UIMessage } from '../../hooks/useChat'
import MessageRow from './MessageRow'
import Spinner from '../Spinner'

const NEAR_BOTTOM = 80

export default function MessageList({
  items,
  loading,
  hasMore,
  loadingOlder,
  onLoadOlder,
  phase,
}: {
  items: UIMessage[]
  loading: boolean
  hasMore: boolean
  loadingOlder: boolean
  onLoadOlder: () => void
  phase: Phase | null
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const prev = useRef<{ firstId?: string; height: number }>({ height: 0 })
  const [atBottom, setAtBottom] = useState(true)
  const [announce, setAnnounce] = useState('')
  const wasBusy = useRef(false)

  function onScroll() {
    const el = scroller.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM
    stick.current = near
    setAtBottom(near)
  }

  // Keep the view where the user is: follow new text only if they are at the
  // bottom, and when older messages are prepended, offset the scroll so nothing jumps.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const firstId = items[0]?.id
    const p = prev.current
    if (p.firstId && firstId !== p.firstId && p.height) {
      el.scrollTop += el.scrollHeight - p.height
    } else if (stick.current) {
      el.scrollTop = el.scrollHeight
    }
    prev.current = { firstId, height: el.scrollHeight }
  }, [items])

  // Sending a message always brings the user back to the bottom.
  useEffect(() => {
    if (phase === 'waiting') stick.current = true
  }, [phase])

  // Load older messages when the top sentinel scrolls into view.
  useEffect(() => {
    const el = top.current
    const root = scroller.current
    if (!el || !root || !hasMore || loadingOlder) return
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadOlder(), { root, rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loadingOlder, items.length, onLoadOlder])

  // Announce once when a reply finishes, never per token.
  useEffect(() => {
    const busy = phase !== null
    if (wasBusy.current && !busy) {
      setAnnounce('Response complete')
      const t = setTimeout(() => setAnnounce(''), 1500)
      wasBusy.current = busy
      return () => clearTimeout(t)
    }
    wasBusy.current = busy
  }, [phase])

  function jump() {
    const el = scroller.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scroller}
        onScroll={onScroll}
        role="log"
        aria-label="Conversation"
        aria-busy={phase !== null}
        className="h-full overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-7 px-4 pb-6 pt-6">
          <div ref={top} aria-hidden="true" />
          {loadingOlder && (
            <div className="flex justify-center text-slate-500">
              <Spinner />
            </div>
          )}
          {loading && (
            <div className="space-y-6" role="status" aria-label="Loading conversation">
              <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-line" />
              <div className="space-y-2.5">
                <div className="h-3 w-full animate-pulse rounded-full bg-line" />
                <div className="h-3 w-5/6 animate-pulse rounded-full bg-line" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-line" />
              </div>
            </div>
          )}
          {items.map((m) => (
            <MessageRow key={m.clientKey ?? m.id} message={m} waiting={phase === 'waiting' && m.status === 'streaming'} />
          ))}
        </div>
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={jump}
          aria-label="Jump to latest message"
          className="absolute bottom-3 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition-colors hover:border-brand hover:text-brand"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      )}

      <p role="status" className="sr-only">
        {announce}
      </p>
    </div>
  )
}
