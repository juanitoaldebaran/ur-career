import { useCallback, useEffect, useRef, useState } from 'react'
import { blankCv, exampleCv, normalizeCv, type CvData } from '../lib/cv'

export type SaveState = 'saved' | 'saving'

const keyFor = (userId: string) => `ur_career_cv:${userId}`

function load(userId: string, email: string): CvData {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    if (raw) return normalizeCv(JSON.parse(raw), email)
  } catch {
    // unreadable or blocked storage: start fresh
  }
  return blankCv(email)
}

// The CV lives in this browser (localStorage), keyed by user. Nothing is sent to the server.
export function useCv(userId: string, email: string) {
  const [data, setData] = useState<CvData>(() => load(userId, email))
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const first = useRef(true)

  // Debounced autosave: one write after typing pauses.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaveState('saving')
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(keyFor(userId), JSON.stringify(data))
      } catch {
        // storage full or blocked: the CV still works for this session
      }
      setSaveState('saved')
    }, 600)
    return () => clearTimeout(timer)
  }, [data, userId])

  const reset = useCallback(() => setData(blankCv(email)), [email])
  const loadExample = useCallback(() => setData(exampleCv()), [])

  return { data, setData, saveState, reset, loadExample }
}
