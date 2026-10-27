import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import { ApiError, submitQuiz, type QuizSession, type QuizResult } from '../lib/api'
import ScoreRing from './ScoreRing'
import { scoreTone } from '../lib/scoreTone'
import Spinner from './Spinner'

const EASE = [0.22, 1, 0.36, 1] as const
const LETTERS = ['A', 'B', 'C', 'D', 'E']

export default function QuizRunner({
  session,
  onRestart,
}: {
  session: QuizSession
  onRestart: () => void
}) {
  const { accessToken } = useAuth()
  const items = session.questions
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = items[index]
  const answered = Object.keys(answers).length
  const isLast = index === items.length - 1

  async function submit() {
    if (!accessToken) return
    setSubmitting(true)
    setError(null)
    try {
      setResult(await submitQuiz(session.id, answers, accessToken))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const tone = scoreTone(result.score)
    const byId = new Map(result.review.map((r) => [r.question_id, r]))
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-white p-6">
          <ScoreRing score={result.score} />
          <div className="min-w-0 flex-1">
            <p className={`text-lg font-semibold ${tone.text}`}>{tone.label}</p>
            <p className="mt-1 text-sm text-slate-600">
              You got {result.correct} of {result.total} questions right.
            </p>
          </div>
          <button onClick={onRestart} className="btn btn-primary">
            New quiz
          </button>
        </div>

        <p className="eyebrow mt-8">Review</p>
        <ol className="mt-3 space-y-4">
          {items.map((item, i) => {
            const r = byId.get(item.id)
            return (
              <li key={item.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${r?.is_correct ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    aria-label={r?.is_correct ? 'Correct' : 'Incorrect'}
                  >
                    {r?.is_correct ? '✓' : '✕'}
                  </span>
                  <p className="text-sm font-medium leading-snug">
                    {i + 1}. {item.prompt}
                  </p>
                </div>
                <ul className="mt-3 space-y-1.5 pl-9">
                  {item.options?.map((opt, o) => {
                    const isCorrect = r?.correct === o
                    const isPicked = r?.selected === o
                    return (
                      <li
                        key={o}
                        className={`rounded-lg border px-3 py-2 text-sm ${isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : isPicked ? 'border-rose-300 bg-rose-50 text-rose-900' : 'border-line text-slate-500'}`}
                      >
                        <span className="mr-2 font-mono text-xs">{LETTERS[o]}</span>
                        {opt}
                        {isPicked && !isCorrect && <span className="ml-2 text-xs">(your answer)</span>}
                      </li>
                    )
                  })}
                </ul>
                {r?.explanation && <p className="mt-3 pl-9 text-xs leading-relaxed text-slate-500">{r.explanation}</p>}
              </li>
            )
          })}
        </ol>
      </motion.div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-slate-400">
        <span>
          Question {index + 1} / {items.length}
        </span>
        <span>{answered} answered</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-brand"
          animate={{ width: `${((index + 1) / items.length) * 100}%` }}
          transition={{ duration: 0.3, ease: EASE }}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          <h2 className="mt-6 text-lg font-medium leading-snug">{current.prompt}</h2>
          <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Answer options">
            {current.options?.map((opt, o) => {
              const selected = answers[current.id] === o
              return (
                <button
                  key={o}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((a) => ({ ...a, [current.id]: o }))}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${selected ? 'border-ink bg-slate-50' : 'border-line hover:border-slate-400'}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs ${selected ? 'bg-ink text-white' : 'border border-line text-slate-500'}`}
                  >
                    {LETTERS[o]}
                  </span>
                  <span className="pt-0.5 leading-snug">{opt}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={() => setIndex(index - 1)} disabled={index === 0} className="btn disabled:opacity-40">
          Back
        </button>
        {isLast ? (
          <button onClick={submit} disabled={submitting || answered === 0} className="btn btn-primary disabled:opacity-50">
            {submitting && <Spinner />}
            {submitting ? 'Scoring…' : answered < items.length ? `Submit (${items.length - answered} blank)` : 'Submit quiz'}
          </button>
        ) : (
          <button onClick={() => setIndex(index + 1)} className="btn btn-primary">
            Next
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
