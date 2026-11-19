import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Dictation with the browser's built-in speech recognition (Web Speech API).
// No backend, no API cost. Support varies (Chrome, Edge and Safari yes; Firefox no),
// so callers must check `supported`. Chrome sends the audio to Google's speech
// service and Safari to Apple's, which the UI says out loud while listening.

interface RecognizerResult {
  readonly [index: number]: { readonly transcript: string }
}
interface Recognizer {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { results: ArrayLike<RecognizerResult> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognizerCtor = new () => Recognizer

function findCtor(): RecognizerCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const MESSAGES: Record<string, string> = {
  'not-allowed': "Microphone access is blocked. Allow it for this site in your browser's settings.",
  'service-not-allowed': "Speech recognition is blocked in this browser. Check your browser's settings.",
  'audio-capture': 'No microphone was found.',
  'no-speech': "Didn't hear anything. Try again.",
  network: 'Speech recognition needs an internet connection.',
  'language-not-supported': "Your browser's language isn't supported for dictation.",
}

export function useSpeechInput(onTranscript: (text: string) => void) {
  const Ctor = useMemo(findCtor, [])
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<Recognizer | null>(null)
  const callback = useRef(onTranscript)

  useEffect(() => {
    callback.current = onTranscript
  }, [onTranscript])

  // `base` is whatever was already in the box; spoken words are appended to it.
  const start = useCallback(
    (base: string) => {
      if (!Ctor || recRef.current) return
      setError(null)

      const rec = new Ctor()
      rec.lang = navigator.language || 'en-US'
      rec.continuous = true
      rec.interimResults = true

      const prefix = base && !/\s$/.test(base) ? `${base} ` : base
      rec.onresult = (e) => {
        // Each event carries every result since start(), so rebuild from scratch
        // (final words plus the still-changing interim guess).
        let spoken = ''
        for (let i = 0; i < e.results.length; i++) spoken += e.results[i][0].transcript
        callback.current(prefix + spoken.trimStart())
      }
      rec.onerror = (e) => {
        if (e.error === 'aborted') return
        setError(MESSAGES[e.error] ?? 'Dictation stopped unexpectedly.')
      }
      rec.onend = () => {
        recRef.current = null
        setListening(false)
      }

      try {
        rec.start()
        recRef.current = rec
        setListening(true)
      } catch {
        setError('Could not start the microphone. Please try again.')
      }
    },
    [Ctor],
  )

  const stop = useCallback(() => recRef.current?.stop(), [])
  const clearError = useCallback(() => setError(null), [])

  // Leaving the page must release the microphone.
  useEffect(() => () => recRef.current?.abort(), [])

  return { supported: Ctor !== undefined, listening, error, start, stop, clearError }
}
