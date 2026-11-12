import { useEffect, useState } from 'react'
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
  const [onlyWrong, setOnlyWrong] = useState(false)

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

  useEffect(() => {
    if (result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      const pick = ['a', 'b', 'c', 'd', 'e'].indexOf(key)
      const num = Number(key) - 1
      const choice = pick >= 0 ? pick : num >= 0 && num < 5 ? num : -1
      const options = items[index]?.options?.length ?? 0
      if (choice >= 0 && choice < options) setAnswers((a) => ({ ...a, [items[index].id]: choice }))
      if (e.key === 'ArrowRight' || e.key === 'Enter') setIndex((i) => Math.min(i + 1, items.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, index, items])

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

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Correct', value: result.correct, tone: 'text-emerald-600' },
            { label: 'Incorrect', value: result.review.filter((r) => !r.is_correct && r.selected !== null).length, tone: 'text-rose-600' },
            { label: 'Skipped', value: result.review.filter((r) => r.selected === null).length, tone: 'text-slate-500' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-line bg-white px-4 py-3">
              <p className={`font-display text-2xl font-semibold leading-none ${stat.tone}`}>{stat.value}</p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="eyebrow">Review</p>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} className="accent-brand" />
            Show only missed
          </label>
        </div>
        <ol className="mt-3 space-y-4">
          {items.map((item, i) => {
            const r = byId.get(item.id)
            if (onlyWrong && r?.is_correct) return null
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
      <div className="mt-3 flex gap-1" role="group" aria-label="Jump to question">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setIndex(i)}
            aria-label={`Question ${i + 1}${answers[item.id] !== undefined ? ', answered' : ''}`}
            aria-current={i === index}
            className={`h-2 flex-1 rounded-full transition-all ${
              i === index ? 'bg-ink' : answers[item.id] !== undefined ? 'bg-brand/60 hover:bg-brand' : 'bg-line hover:bg-slate-300'
            }`}
          />
        ))}
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
        <button onClick={() => setIndex(index - 1)} disabled={index === 0} className="btn btn-ghost disabled:opacity-40">
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
      <p className="mt-4 hidden text-center text-[11px] text-slate-400 sm:block">Press A–D to answer, ← → to move</p>
    </div>
  )
}
