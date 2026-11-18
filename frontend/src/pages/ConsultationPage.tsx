import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getProfileStats, type ProfileStats } from '../lib/api'
import { useChat } from '../hooks/useChat'
import HistoryPanel from '../components/chat/HistoryPanel'
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

const HISTORY_KEY = 'ur_career_history_open'

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
        active ? 'bg-brand-soft text-brand' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}

const PEN = <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>
const CLOCK = <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></>

export default function ConsultationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const chat = useChat(id)
  const isDesktop = useIsDesktop()

  const [draft, setDraft] = useState('')
  const [drawer, setDrawer] = useState(false)
  // Desktop: history is hidden until asked for, like a collapsed sidebar.
  const [historyOpen, setHistoryOpen] = useState(() => {
    try {
      return localStorage.getItem(HISTORY_KEY) === '1'
    } catch {
      return false
    }
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

  function toggleHistory() {
    setHistoryOpen((open) => {
      try {
        localStorage.setItem(HISTORY_KEY, open ? '0' : '1')
      } catch {
        // preference just won't persist
      }
      return !open
    })
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
  const panelHidden = isDesktop ? !historyOpen : !drawer

  return (
    <div className="flex h-[calc(100svh-6rem)] w-full">
      {drawer && !isDesktop && (
        <div className="fixed inset-0 z-[55] bg-ink/40" onClick={closeDrawer} aria-hidden="true" />
      )}

      {/* Desktop rail: flush left, full height, icons only. */}
      <nav
        aria-label="Chat tools"
        className="fixed inset-y-0 left-0 z-10 hidden w-16 flex-col items-center gap-1 border-r border-line bg-white pt-28 md:flex"
      >
        <RailButton label="New chat" onClick={() => navigate('/consultation')}>
          {PEN}
        </RailButton>
        <RailButton label={historyOpen ? 'Hide history' : 'Show history'} active={historyOpen} onClick={toggleHistory}>
          {CLOCK}
        </RailButton>
      </nav>

      <aside
        ref={drawerRef}
        inert={panelHidden}
        aria-label="Conversations"
        aria-modal={drawer && !isDesktop ? true : undefined}
        role={drawer && !isDesktop ? 'dialog' : undefined}
        className={`fixed inset-y-0 left-0 z-[60] w-72 border-r border-line bg-slate-50 transition-transform duration-200 motion-reduce:transition-none md:left-16 md:z-10 md:translate-x-0 md:pt-24 ${
          historyOpen ? 'md:block' : 'md:hidden'
        } ${drawer ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <HistoryPanel
          conversations={chat.conversations}
          loading={chat.convLoading}
          hasMore={chat.convHasMore}
          onLoadMore={chat.loadMoreConversations}
          activeId={id}
          onDelete={chat.removeConversation}
          onNew={() => {
            navigate('/consultation')
            closeDrawer()
          }}
          onClose={isDesktop ? undefined : closeDrawer}
          onCollapse={isDesktop ? toggleHistory : undefined}
        />
      </aside>

      <section className={`flex min-w-0 flex-1 flex-col md:transition-[margin] md:duration-200 motion-reduce:transition-none ${historyOpen ? 'md:ml-[22rem]' : 'md:ml-16'}`}>
        <div className="flex items-center gap-2 border-b border-line px-4 py-2 md:hidden">
          <button
            ref={openerRef}
            onClick={() => setDrawer(true)}
            aria-label="Open conversation history"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>
          <p className="flex-1 text-sm font-medium">Consultation</p>
          <button
            onClick={() => navigate('/consultation')}
            aria-label="New chat"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {PEN}
            </svg>
          </button>
        </div>

        <div className={landing ? 'flex flex-1 flex-col items-center justify-center pb-12' : 'flex min-h-0 flex-1 flex-col'}>
          {landing ? (
            <h1 className="mb-8 px-4 text-center text-3xl font-semibold sm:text-4xl">
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

          <div className={`mx-auto w-full max-w-[720px] px-4 ${landing ? '' : 'pb-[max(1rem,env(safe-area-inset-bottom))]'}`}>
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
            <ul className="mt-5 flex w-full max-w-[720px] flex-wrap justify-center gap-2 px-4">
              {starters.map((text) => (
                <li key={text}>
                  <button
                    onClick={() => submit(text)}
                    className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
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
