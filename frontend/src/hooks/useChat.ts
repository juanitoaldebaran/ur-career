import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import {
  ApiError,
  createConversation,
  deleteConversation,
  listConversations,
  listMessages,
  streamMessage,
  type ChatMessage,
  type Conversation,
} from '../lib/api'

export interface UIMessage extends Omit<ChatMessage, 'status'> {
  status: ChatMessage['status'] | 'streaming'
  // Set on messages sent in this session. It never changes, so the row keeps its
  // React key when the temporary id is swapped for the server id.
  clientKey?: string
}

interface Thread {
  items: UIMessage[]
  nextCursor?: string
  hasMore: boolean
  loaded: boolean
  loadingOlder: boolean
}

export type Phase = 'waiting' | 'streaming'

const emptyThread = (): Thread => ({ items: [], hasMore: false, loaded: true, loadingOlder: false })

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Owns everything the chat UI needs. Threads are cached by conversation id, so
// switching chats is instant and a reply keeps streaming into its own thread.
export function useChat(activeId: string | undefined) {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convCursor, setConvCursor] = useState<string | undefined>()
  const [convHasMore, setConvHasMore] = useState(false)
  const [convLoading, setConvLoading] = useState(true)
  const [threads, setThreads] = useState<Record<string, Thread>>({})
  const [streaming, setStreaming] = useState<{ id: string; phase: Phase } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [threadError, setThreadError] = useState<string | null>(null)

  const threadsRef = useRef(threads)
  threadsRef.current = threads
  const convCountRef = useRef(0)
  convCountRef.current = conversations.length
  const busyRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const seq = useRef(0)

  const patch = useCallback((id: string, fn: (t: Thread) => Thread) => {
    setThreads((all) => ({ ...all, [id]: fn(all[id] ?? emptyThread()) }))
  }, [])

  // ---- conversation list ----

  const refreshConversations = useCallback(async () => {
    if (!accessToken) return
    try {
      const page = await listConversations(accessToken)
      setConversations((prev) => {
        const ids = new Set(page.items.map((c) => c.id))
        return [...page.items, ...prev.filter((c) => !ids.has(c.id))]
      })
      // Keep the paging position if the user had already scrolled deeper.
      if (convCountRef.current <= page.items.length) {
        setConvCursor(page.next_cursor)
        setConvHasMore(page.has_more)
      }
    } catch {
      // the list is a convenience; the chat still works without it
    }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    listConversations(accessToken)
      .then((page) => {
        if (cancelled) return
        setConversations(page.items ?? [])
        setConvCursor(page.next_cursor)
        setConvHasMore(page.has_more)
      })
      .catch(() => {})
      .finally(() => !cancelled && setConvLoading(false))
    return () => {
      cancelled = true
    }
  }, [accessToken])

  const loadMoreConversations = useCallback(async () => {
    if (!accessToken || !convHasMore || convLoading) return
    setConvLoading(true)
    try {
      const page = await listConversations(accessToken, convCursor)
      setConversations((prev) => {
        const ids = new Set(prev.map((c) => c.id))
        return [...prev, ...page.items.filter((c) => !ids.has(c.id))]
      })
      setConvCursor(page.next_cursor)
      setConvHasMore(page.has_more)
    } catch {
      // try again on the next scroll
    } finally {
      setConvLoading(false)
    }
  }, [accessToken, convCursor, convHasMore, convLoading])

  // ---- messages of the active conversation ----

  useEffect(() => {
    setThreadError(null)
    if (!activeId || !accessToken) return
    if (threadsRef.current[activeId]?.loaded) return

    let cancelled = false
    listMessages(activeId, accessToken)
      .then((page) => {
        if (cancelled) return
        setThreads((all) => ({
          ...all,
          [activeId]: {
            items: page.items ?? [],
            nextCursor: page.next_cursor,
            hasMore: page.has_more,
            loaded: true,
            loadingOlder: false,
          },
        }))
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          navigate('/consultation', { replace: true })
          return
        }
        setThreadError(errorText(err, 'Could not load this conversation.'))
      })
    return () => {
      cancelled = true
    }
  }, [activeId, accessToken, navigate])

  const loadOlder = useCallback(async () => {
    if (!activeId || !accessToken) return
    const t = threadsRef.current[activeId]
    if (!t || !t.hasMore || t.loadingOlder) return
    patch(activeId, (th) => ({ ...th, loadingOlder: true }))
    try {
      const page = await listMessages(activeId, accessToken, t.nextCursor)
      patch(activeId, (th) => ({
        ...th,
        items: [...(page.items ?? []), ...th.items],
        nextCursor: page.next_cursor,
        hasMore: page.has_more,
        loadingOlder: false,
      }))
    } catch {
      patch(activeId, (th) => ({ ...th, loadingOlder: false }))
    }
  }, [activeId, accessToken, patch])

  // ---- sending ----

  // Resolves false only when nothing was sent (so the caller can restore the text).
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      if (!accessToken || busyRef.current) return false
      busyRef.current = true
      setError(null)

      let id = activeId
      if (!id) {
        try {
          const conv = await createConversation(accessToken)
          id = conv.id
          setThreads((all) => ({ ...all, [conv.id]: emptyThread() }))
          setConversations((prev) => [conv, ...prev])
          // Same route element, so the page (and this stream) is not remounted.
          navigate(`/consultation/${conv.id}`, { replace: true })
        } catch (err) {
          busyRef.current = false
          setError(errorText(err, 'Could not start a conversation. Please try again.'))
          return false
        }
      }
      const convId = id

      const n = ++seq.current
      const now = new Date().toISOString()
      const userMsg: UIMessage = { id: `local-u-${n}`, clientKey: `local-u-${n}`, role: 'user', content: text, status: 'complete', created_at: now }
      const draftId = `local-a-${n}`
      const draft: UIMessage = { id: draftId, clientKey: draftId, role: 'assistant', content: '', status: 'streaming', created_at: now }
      patch(convId, (th) => ({ ...th, items: [...th.items, userMsg, draft] }))
      setStreaming({ id: convId, phase: 'waiting' })

      const controller = new AbortController()
      abortRef.current = controller

      let pending = ''
      let frame = 0
      let gotText = false
      let finished = false

      const apply = (fn: (m: UIMessage) => UIMessage) =>
        patch(convId, (th) => ({ ...th, items: th.items.map((m) => (m.id === draftId ? fn(m) : m)) }))

      const flush = () => {
        frame = 0
        if (!pending) return
        const chunk = pending
        pending = ''
        apply((m) => ({ ...m, content: m.content + chunk }))
      }
      // Batch token updates to one render per animation frame.
      const finalize = (fn: (m: UIMessage) => UIMessage) => {
        if (frame) cancelAnimationFrame(frame)
        flush()
        apply(fn)
        finished = true
      }

      let sent = true
      try {
        await streamMessage(convId, text, accessToken, controller.signal, {
          onDelta: (t) => {
            if (!gotText) {
              gotText = true
              setStreaming({ id: convId, phase: 'streaming' })
            }
            pending += t
            if (!frame) frame = requestAnimationFrame(flush)
          },
          onDone: (info) =>
            finalize((m) => ({
              ...m,
              id: info.message_id ?? m.id,
              status: info.status === 'interrupted' ? 'interrupted' : 'complete',
            })),
          onError: () => finalize((m) => ({ ...m, status: 'interrupted' })),
        })
        // The connection closed without a done/error event.
        if (!finished) finalize((m) => ({ ...m, status: m.content ? 'interrupted' : 'error' }))
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === 'AbortError'
        if (gotText || aborted) {
          // Keep whatever text arrived. Stop leaves it as an interrupted reply.
          finalize((m) => ({ ...m, status: 'interrupted' }))
          if (aborted && !gotText) {
            patch(convId, (th) => ({ ...th, items: th.items.filter((m) => m.id !== draftId) }))
          }
        } else {
          // Rejected before the first token (404/409/429/502...): undo and hand the text back.
          patch(convId, (th) => ({
            ...th,
            items: th.items.filter((m) => m.id !== draftId && m.id !== userMsg.id),
          }))
          setError(errorText(err, 'Could not get a response. Please try again.'))
          sent = false
        }
      } finally {
        if (frame) cancelAnimationFrame(frame)
        abortRef.current = null
        busyRef.current = false
        setStreaming(null)
        void refreshConversations()
      }
      return sent
    },
    [accessToken, activeId, navigate, patch, refreshConversations],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const removeConversation = useCallback(
    async (id: string) => {
      if (!accessToken) return
      try {
        await deleteConversation(id, accessToken)
      } catch (err) {
        setError(errorText(err, 'Could not delete the conversation.'))
        return
      }
      setConversations((prev) => prev.filter((c) => c.id !== id))
      setThreads((all) => {
        const { [id]: _removed, ...rest } = all
        return rest
      })
      if (id === activeId) navigate('/consultation')
    },
    [accessToken, activeId, navigate],
  )

  // Leaving the page cancels any reply in flight.
  useEffect(() => () => abortRef.current?.abort(), [])

  return {
    conversations,
    convLoading,
    convHasMore,
    loadMoreConversations,
    thread: activeId ? threads[activeId] : undefined,
    threadError,
    streaming: streaming && streaming.id === activeId ? streaming : null,
    busy: streaming !== null,
    error,
    dismissError: () => setError(null),
    send,
    stop,
    loadOlder,
    removeConversation,
  }
}
