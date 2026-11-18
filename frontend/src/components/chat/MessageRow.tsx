import { memo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { UIMessage } from '../../hooks/useChat'
import Markdown from './Markdown'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked: nothing useful to do
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {copied ? <path d="M5 12l5 5 9-10" /> : <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>}
      </svg>
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const EASE = [0.22, 1, 0.36, 1] as const

function MessageRow({ message, waiting }: { message: UIMessage; waiting: boolean }) {
  const reduce = useReducedMotion()
  // Only messages sent in this session animate in. Loaded history appears instantly.
  const enter = {
    initial: message.clientKey && !reduce ? { opacity: 0, y: 6 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.22, ease: EASE },
  } as const

  if (message.role === 'user') {
    return (
      <motion.div className="flex justify-end" {...enter}>
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-brand-soft px-4 py-2.5 text-[15px] leading-relaxed text-ink">
          {message.content}
        </p>
      </motion.div>
    )
  }

  const streaming = message.status === 'streaming'

  return (
    <motion.div className="group flex gap-3" {...enter}>
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-[13px] font-bold leading-none text-white"
      >
        u
      </span>
      <div className="min-w-0 flex-1">
        {message.content ? (
          <Markdown text={message.content} />
        ) : waiting ? (
          <div className="space-y-2.5 py-1" role="status" aria-label="Waiting for a response">
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-line" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-line" />
          </div>
        ) : null}

        {message.status === 'interrupted' && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">Response stopped</p>
        )}
        {message.status === 'error' && <p className="mt-2 text-sm text-red-700">Couldn&apos;t get a response.</p>}

        {!streaming && message.content && (
          <div className="mt-2 -ml-2 flex opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Finished messages never re-render while a later one streams.
export default memo(MessageRow)
