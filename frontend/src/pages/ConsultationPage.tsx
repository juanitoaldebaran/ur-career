import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getProfileStats, type ProfileStats } from '../lib/api'
import { useChat } from '../hooks/useChat'
import Sidebar from '../components/chat/Sidebar'
import { Icon } from '../components/icons'
import MessageList from '../components/chat/MessageList'
import Composer from '../components/chat/Composer'

const DESKTOP = '(min-width: 768px)'

function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DESKTOP)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  )
}

// Short suggestions. The server already adds the user's roadmap and quiz context,
// so these can stay brief. Some only show when there is data behind them.
function buildStarters(stats: ProfileStats | null): string[] {
  const out: string[] = []
  if (stats?.roadmaps.some((r) => r.total_nodes > 0)) out.push('What should I learn next?')
  if (stats && stats.quiz.total_taken > 0) out.push('Where are my biggest gaps?')
  out.push('Plan my next 30 days')
  out.push('How do I prepare for interviews?')
  return out.slice(0, 3)
}

const SIDEBAR_KEY = 'ur_career_sidebar_expanded'

export default function ConsultationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const chat = useChat(id)
  const isDesktop = useIsDesktop()

  const [draft, setDraft] = useState('')
  const [drawer, setDrawer] = useState(false)
  // Desktop sidebar: expanded drawer or collapsed icon rail. The choice is remembered;
  // first visit starts expanded on wide screens and collapsed on narrow ones.
  const [expanded, setExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY)
      if (saved !== null) return saved === '1'
    } catch {
      // fall through to the default
    }
    return window.innerWidth >= 1024
  })
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!accessToken) return
    getProfileStats(accessToken)
      .then(setStats)
      .catch(() => {})
  }, [accessToken])

  const closeDrawer = useCallback(() => setDrawer(false), [])

  // The navbar centres itself on the content area, so tell it how wide the sidebar is.
  useEffect(() => {
    const width = isDesktop ? (expanded ? '240px' : '56px') : '0px'
    document.documentElement.style.setProperty('--sidebar-w', width)
    return () => {
      document.documentElement.style.removeProperty('--sidebar-w')
    }
  }, [isDesktop, expanded])

  function setSidebar(next: boolean) {
    setExpanded(next)
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
    } catch {
      // the preference just won't persist
    }
  }

  // Mobile drawer: Esc closes, Tab stays inside, focus returns to the opener.
  useEffect(() => {
    if (!drawer || isDesktop) return
    const panel = drawerRef.current
    const opener = openerRef.current
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    focusable()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return setDrawer(false)
      if (e.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [drawer, isDesktop])

  async function submit(text: string) {
    const value = text.trim()
    if (!value || chat.busy) return
    setDraft('')
    const sent = await chat.send(value)
    if (!sent) setDraft(value) // nothing was sent, so give the text back
  }

  const items = chat.thread?.items ?? []
  const loading = !!id && !chat.thread?.loaded && !chat.threadError
  const landing = !id || (!!chat.thread?.loaded && items.length === 0 && !chat.busy)
  const starters = buildStarters(stats)

  return (
    <div className="flex h-[calc(100svh-6rem)] w-full">
      {/* Mobile: backdrop behind the slide-over drawer. */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={`fixed inset-0 z-[55] bg-ink/40 transition-opacity duration-200 md:hidden ${
          drawer ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <Sidebar
        panelRef={drawerRef}
        isDesktop={isDesktop}
        expanded={expanded}
        drawerOpen={drawer}
        newActive={!id}
        onToggle={() => setSidebar(!expanded)}
        onCloseDrawer={closeDrawer}
        onNewChat={() => {
          navigate('/consultation')
          closeDrawer()
        }}
        onOpenHistory={() => setSidebar(true)}
        conversations={chat.conversations}
        loading={chat.convLoading}
        hasMore={chat.convHasMore}
        onLoadMore={chat.loadMoreConversations}
        activeId={id}
        onDelete={chat.removeConversation}
      />

      <section className={`flex min-w-0 flex-1 flex-col md:transition-[margin] md:duration-200 motion-reduce:transition-none ${expanded ? 'md:ml-[240px]' : 'md:ml-14'}`}>
        <div className="flex items-center gap-2 px-3 py-2 md:hidden">
          <button
            ref={openerRef}
            onClick={() => setDrawer(true)}
            aria-label="Open conversation history"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-slate-100"
          >
            <Icon name="menu" />
          </button>
          <p className="flex-1 text-sm font-medium">Consultation</p>
          <button
            onClick={() => navigate('/consultation')}
            aria-label="New chat"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-slate-100"
          >
            <Icon name="newChat" />
          </button>
        </div>

        <div className={landing ? 'flex flex-1 flex-col items-center justify-center pb-12' : 'flex min-h-0 flex-1 flex-col'}>
          {landing ? (
            <h1 className="mb-8 px-4 text-center text-[1.75rem] font-semibold leading-tight sm:text-4xl">
              What are you <span className="text-brand">working toward?</span>
            </h1>
          ) : chat.threadError && !chat.thread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-sm text-red-700">{chat.threadError}</p>
              <Link to="/consultation" className="btn btn-ghost">
                Start a new chat
              </Link>
            </div>
          ) : (
            <MessageList
              key={id ?? 'new'}
              items={items}
              loading={loading}
              hasMore={chat.thread?.hasMore ?? false}
              loadingOlder={chat.thread?.loadingOlder ?? false}
              onLoadOlder={chat.loadOlder}
              phase={chat.streaming?.phase ?? null}
            />
          )}

          <div className={`mx-auto w-full max-w-[768px] px-4 ${landing ? '' : 'pb-[max(1rem,env(safe-area-inset-bottom))]'}`}>
            {chat.error && (
              <div role="alert" className="mb-3 flex items-start justify-between gap-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                <span>{chat.error}</span>
                <button onClick={chat.dismissError} aria-label="Dismiss error" className="shrink-0 font-medium hover:underline">
                  Dismiss
                </button>
              </div>
            )}
            <Composer value={draft} onChange={setDraft} onSubmit={() => submit(draft)} onStop={chat.stop} busy={chat.busy} />
          </div>

          {landing && (
            <ul className="mt-4 flex w-full max-w-[768px] flex-wrap justify-center gap-2 px-4">
              {starters.map((text) => (
                <li key={text}>
                  <button
                    onClick={() => submit(text)}
                    className="min-h-10 rounded-full border border-line bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-brand/50 hover:bg-brand-soft hover:text-ink"
                  >
                    {text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
