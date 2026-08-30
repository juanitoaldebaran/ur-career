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
        className="-mb-1 ml-0.5 inline-block h-5 w-px animate-pulse bg-slate-900"
        aria-hidden="true"
      />
    </>
  )
}
