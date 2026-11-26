import { motion, useReducedMotion } from 'motion/react'
import type { CvReview } from '../../lib/api'
import { scoreTone } from '../../lib/scoreTone'
import { CRITERIA } from '../../lib/cvCriteria'
import ScoreRing from '../ScoreRing'

export default function ReviewResult({ review, onReset }: { review: CvReview; onReset: () => void }) {
  const reduce = useReducedMotion()
  const tone = scoreTone(review.score)

  return (
    <section aria-labelledby="review-heading" className="mt-10">
      <div className="flex flex-col gap-6 border-y border-line py-8 sm:flex-row sm:items-center">
        <ScoreRing score={review.score} />
        <div>
          <h2 id="review-heading" tabIndex={-1} ref={(el) => el?.focus()} className="text-2xl font-semibold outline-none">
            <span className={tone.text}>{tone.label}</span> for {review.target_role}
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-slate-600">{review.summary}</p>
        </div>
      </div>

      <ul>
        {review.criteria.map((c) => {
          const percent = (c.score / c.max) * 100
          return (
            <li key={c.name} className="grid gap-3 border-b border-line py-6 sm:grid-cols-[12rem_1fr] sm:gap-8">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold">{CRITERIA[c.name]?.label ?? c.name}</h3>
                  <span className="font-mono text-xs text-slate-500">
                    {c.score}/{c.max}
                  </span>
                </div>
                <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <motion.div
                    className={`h-full rounded-full ${scoreTone(percent).bar}`}
                    initial={{ width: reduce ? `${percent}%` : 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{c.comment}</p>
            </li>
          )
        })}
      </ul>

      <button type="button" onClick={onReset} className="btn btn-primary mt-8 min-h-11 w-full sm:w-auto">
        Review another CV
      </button>
    </section>
  )
}
