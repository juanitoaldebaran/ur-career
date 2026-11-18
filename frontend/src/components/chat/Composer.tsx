import { useEffect, useRef, type KeyboardEvent } from 'react'

const MAX_LENGTH = 4000
const MAX_HEIGHT = 192

export default function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onStop: () => void
  busy: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Grow with the text, up to about 6 lines.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) ref.current?.focus()
  }, [])

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (!busy) onSubmit()
    }
    if (e.key === 'Escape' && busy) onStop()
  }

  const canSend = value.trim().length > 0 && !busy
  const nearLimit = value.length > MAX_LENGTH - 500

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-white py-2 pl-5 pr-2 shadow-[0_1px_2px_rgba(10,14,26,0.04),0_10px_28px_-14px_rgba(10,14,26,0.18)] transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        <label htmlFor="chat-input" className="sr-only">
          Message your career coach
        </label>
        <textarea
          id="chat-input"
          ref={ref}
          rows={1}
          value={value}
          maxLength={MAX_LENGTH}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about your career…"
          className="max-h-48 min-h-[2.75rem] flex-1 resize-none bg-transparent py-2.5 text-base leading-6 text-ink outline-none placeholder:text-slate-500"
        />
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-brand"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-brand disabled:bg-line disabled:text-slate-500"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>
      <p className="mt-2 flex items-center justify-between gap-3 px-2 text-[11px] leading-snug text-slate-500">
        {nearLimit && (
          <span className="shrink-0 font-mono">
            {value.length}/{MAX_LENGTH}
          </span>
        )}
      </p>
    </div>
  )
}
