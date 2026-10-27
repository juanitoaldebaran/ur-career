import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import {
  ApiError,
  createQuiz,
  getProfile,
  listPracticeQuestions,
  listRoadmaps,
  submitPracticeAnswer,
  type PracticeCategory,
  type PracticeQuestion,
  type PracticeResult,
  type QuizSession,
  type RoadmapSummary,
} from '../lib/api'
import { findTargetRoadmap } from '../lib/targetRoadmap'
import { scoreTone } from '../lib/scoreTone'
import ScoreRing from '../components/ScoreRing'
import QuizRunner from '../components/QuizRunner'
import Spinner from '../components/Spinner'

const EASE = [0.22, 1, 0.36, 1] as const
const MIN_ANSWER = 20
const MAX_ANSWER = 8000
const QUIZ_SIZE = 15

type Tab = PracticeCategory | 'quiz'

const TABS: { key: Tab; label: string }[] = [
  { key: 'coding', label: 'Coding' },
  { key: 'system_design', label: 'System design' },
  { key: 'quiz', label: 'Quiz' },
]

const DIFFICULTY_STYLE: Record<PracticeQuestion['difficulty'], string> = {
  easy: 'text-emerald-600',
  medium: 'text-amber-600',
  hard: 'text-rose-600',
}

function ResultPanel({ result }: { result: PracticeResult }) {
  const tone = scoreTone(result.score)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mt-6 space-y-6 rounded-xl border border-line bg-slate-50/60 p-5"
    >
      <div className="flex items-center gap-5">
        <ScoreRing score={result.score} />
        <div>
          <p className={`text-lg font-semibold ${tone.text}`}>{tone.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{result.feedback}</p>
        </div>
      </div>

      <div>
        <p className="eyebrow">Score breakdown</p>
        <ul className="mt-3 space-y-3">
          {result.criteria.map((c) => (
            <li key={c.name}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="font-mono text-xs text-slate-500">
                  {c.score}/{c.max}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                <motion.div
                  className={`h-full rounded-full ${scoreTone((c.score / c.max) * 100).bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(c.score / c.max) * 100}%` }}
                  transition={{ duration: 0.7, ease: EASE }}
                />
              </div>
              {c.comment && <p className="mt-1 text-xs text-slate-500">{c.comment}</p>}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="eyebrow">Model answer</p>
        <div className="mt-2 whitespace-pre-wrap rounded-lg border border-line bg-white p-4 text-sm leading-relaxed text-slate-700">
          {result.reference_answer}
        </div>
      </div>
    </motion.div>
  )
}

function QuestionCard({
  question,
  open,
  onToggle,
  onScored,
}: {
  question: PracticeQuestion
  open: boolean
  onToggle: () => void
  onScored: (id: string, score: number) => void
}) {
  const { accessToken } = useAuth()
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PracticeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tooShort = answer.trim().length < MIN_ANSWER
  const isCode = question.category === 'coding'

  async function submit() {
    if (!accessToken || tooShort) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitPracticeAnswer(question.id, answer.trim(), accessToken)
      setResult(res)
      onScored(question.id, res.score)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? 'You have used today’s practice limit. Try again tomorrow.'
          : err instanceof ApiError
            ? err.message
            : 'Could not score your answer. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-colors ${open ? 'border-ink' : 'border-line hover:border-slate-300'}`}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-4 p-5 text-left sm:p-6">
        <p className="min-w-0 flex-1 text-base font-medium leading-snug">{question.prompt}</p>
        <div className="flex shrink-0 items-center gap-3">
          {question.best_score !== null && <span className="chip chip-brand">Best {question.best_score}</span>}
          <span className={`font-mono text-[11px] font-medium uppercase tracking-wider ${DIFFICULTY_STYLE[question.difficulty]}`}>
            {question.difficulty}
          </span>
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="space-y-6 border-t border-line p-5 sm:p-6">
              <div>
                <p className="eyebrow">How to approach it</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{question.approach}</p>
              </div>
              <div>
                <p className="eyebrow">What they’re evaluating</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{question.evaluating}</p>
              </div>

              <div>
                <label htmlFor={`answer-${question.id}`} className="eyebrow">
                  Draft your answer
                </label>
                <textarea
                  id={`answer-${question.id}`}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.slice(0, MAX_ANSWER))}
                  rows={isCode ? 10 : 8}
                  spellCheck={!isCode}
                  placeholder={isCode ? 'Explain your approach, then write your code…' : 'Requirements, components, data model, scaling and trade-offs…'}
                  className={`mt-2 w-full resize-y rounded-xl border border-line bg-white p-4 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10 ${isCode ? 'font-mono' : ''}`}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-slate-400">
                    {answer.length}/{MAX_ANSWER}
                  </span>
                  <button onClick={submit} disabled={submitting || tooShort} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                    {submitting && <Spinner />}
                    {submitting ? 'Scoring…' : result ? 'Score again' : 'Get score & feedback'}
                  </button>
                </div>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              </div>

              {result && <ResultPanel result={result} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PracticePage() {
  const { accessToken } = useAuth()
  const [roles, setRoles] = useState<RoadmapSummary[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('coding')
  const [questions, setQuestions] = useState<PracticeQuestion[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<QuizSession | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Roles are the roadmaps; start on the one matching the user's target role.
  useEffect(() => {
    if (!accessToken) return
    Promise.all([listRoadmaps(accessToken), getProfile(accessToken).catch(() => null)])
      .then(([list, profile]) => {
        setRoles(list)
        const target = findTargetRoadmap(profile?.target_role)
        setRole(list.find((r) => r.slug === target?.slug)?.slug ?? list[0]?.slug ?? null)
      })
      .catch(() => setError('Could not load roles.'))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !role) return
    let stale = false
    setQuestions(null)
    setQuiz(null)
    setOpenId(null)
    setError(null)
    listPracticeQuestions(role, accessToken)
      .then((q) => !stale && setQuestions(q))
      .catch(() => !stale && setError('Could not load questions.'))
    return () => {
      stale = true
    }
  }, [accessToken, role])

  const counts = useMemo(() => {
    const c: Record<PracticeCategory, number> = { coding: 0, system_design: 0 }
    questions?.forEach((q) => c[q.category]++)
    return c
  }, [questions])

  const visible = tab === 'quiz' ? [] : (questions?.filter((q) => q.category === tab) ?? [])

  function handleScored(id: string, score: number) {
    setQuestions((prev) =>
      prev?.map((q) => (q.id === id ? { ...q, best_score: Math.max(q.best_score ?? 0, score) } : q)) ?? prev,
    )
  }

  async function startQuiz() {
    if (!accessToken || !role) return
    setQuizLoading(true)
    setError(null)
    try {
      setQuiz(await createQuiz(role, accessToken))
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? 'You have used today’s practice limit. Try again tomorrow.'
          : 'Could not generate the quiz. Please try again.',
      )
    } finally {
      setQuizLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
        <p className="eyebrow">Practice</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          Rehearse the <span className="text-brand">real interview</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-500">
          Pick a role, answer, and get a score with feedback. The quiz is generated fresh every time.
        </p>
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Role">
        {roles.map((r) => (
          <button
            key={r.slug}
            role="radio"
            aria-checked={role === r.slug}
            onClick={() => setRole(r.slug)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${role === r.slug ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate-600 hover:border-slate-400'}`}
          >
            {r.title}
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key)
              setOpenId(null)
              setError(null)
            }}
            className={`relative whitespace-nowrap px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${tab === t.key ? 'text-ink' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.label} <span className="ml-1 text-slate-400">{t.key === 'quiz' ? QUIZ_SIZE : counts[t.key]}</span>
            {tab === t.key && <motion.span layoutId="practice-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {tab === 'quiz' ? (
        <div className="mt-6">
          {!quiz ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
              <p className="mx-auto max-w-sm text-sm text-slate-500">
                {QUIZ_SIZE} multiple-choice questions on what this role should know. New questions every session.
              </p>
              <button onClick={startQuiz} disabled={!role || quizLoading} className="btn btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-50">
                {quizLoading && <Spinner />}
                {quizLoading ? 'Generating quiz…' : `Start ${QUIZ_SIZE}-question quiz`}
              </button>
            </div>
          ) : (
            <QuizRunner key={quiz.id} session={quiz} onRestart={() => setQuiz(null)} />
          )}
        </div>
      ) : (
        <>
          {!error && !questions && <p className="mt-8 text-sm text-slate-400">Loading…</p>}
          {questions && visible.length === 0 && <p className="mt-8 text-sm text-slate-500">No questions in this category yet.</p>}
          <div className="mt-6 space-y-4">
            {visible.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                open={openId === q.id}
                onToggle={() => setOpenId(openId === q.id ? null : q.id)}
                onScored={handleScored}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
