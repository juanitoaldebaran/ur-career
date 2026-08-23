import { useEffect, useState } from 'react'

export function useTypewriter(text: string, speedMs = 40): string {
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (!text) {
      setOutput('')
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setOutput(text)
      return
    }

    setOutput('')
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setOutput(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
      }
    }, speedMs)

    return () => clearInterval(interval)
  }, [text, speedMs])

  return output
}
