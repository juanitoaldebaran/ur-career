import { useTypewriter } from '../hooks/useTypewriter'

interface TypingWordProps {
  text: string
  highlightFrom?: number
  highlightClassName?: string
  speedMs?: number
}

export default function TypingWord({
  text,
  highlightFrom,
  highlightClassName = 'text-blue-600',
  speedMs,
}: TypingWordProps) {
  const typed = useTypewriter(text, speedMs)

  const plain = highlightFrom !== undefined ? typed.slice(0, highlightFrom) : typed
  const highlighted = highlightFrom !== undefined ? typed.slice(highlightFrom) : ''

  return (
    <>
      {plain}
      {highlightFrom !== undefined && <span className={highlightClassName}>{highlighted}</span>}
      <span
        className="ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.08em] animate-caret-blink rounded-full bg-blue-600 align-middle"
        aria-hidden="true"
      />
    </>
  )
}
