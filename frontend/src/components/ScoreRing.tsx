import { motion } from 'motion/react'
import { scoreTone } from '../lib/scoreTone'

export default function ScoreRing({ score }: { score: number }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const tone = scoreTone(score)
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-line" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className={`stroke-current ${tone.text}`}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold leading-none">{score}</span>
        <span className="font-mono text-[10px] text-slate-400">/ 100</span>
      </div>
    </div>
  )
}
