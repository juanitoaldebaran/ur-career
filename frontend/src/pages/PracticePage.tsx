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
  easy: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  hard: 'bg-rose-50 text-rose-700',
}

const DIFFICULTY_ORDER: Record<PracticeQuestion['difficulty'], number> = { easy: 0, medium: 1, hard: 2 }

type DifficultyFilter = 'all' | PracticeQuestion['difficulty']
const DIFFICULTY_FILTERS: DifficultyFilter[] = ['all', 'easy', 'medium', 'hard']

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
  index,
  open,
  onToggle,
  onScored,
}: {
  question: PracticeQuestion
  index: number
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
        <span className="mt-0.5 font-mono text-xs text-slate-300">{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium leading-snug">{question.prompt}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${DIFFICULTY_STYLE[question.difficulty]}`}>
              {question.difficulty}
            </span>
            {question.best_score !== null ? (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${scoreTone(question.best_score).text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${scoreTone(question.best_score).bar}`} />
                Best {question.best_score}/100
              </span>
            ) : (
              <span className="text-xs text-slate-400">Not attempted</span>
            )}
          </div>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-brand-soft/70 p-4">
                  <p className="eyebrow">How to approach it</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{question.approach}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="eyebrow !text-slate-500">What they’re evaluating</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{question.evaluating}</p>
                </div>
              </div>

              <div>
                <label htmlFor={`answer-${question.id}`} className="eyebrow">
                  Draft your answer
                </label>
                <textarea
                  id={`answer-${question.id}`}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.slice(0, MAX_ANSWER))}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit()
                  }}
                  rows={isCode ? 10 : 8}
                  spellCheck={!isCode}
                  placeholder={isCode ? 'Explain your approach, then write your code…' : 'Requirements, components, data model, scaling and trade-offs…'}
                  className={`mt-2 w-full resize-y rounded-xl border border-line bg-white p-4 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10 ${isCode ? 'font-mono' : ''}`}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-slate-400">
                    {tooShort ? `${MIN_ANSWER - answer.trim().length} more characters to unlock scoring` : `${answer.length}/${MAX_ANSWER} · ⌘/Ctrl + Enter to submit`}
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
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
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

  const summary = useMemo(() => {
    const all = questions ?? []
    const attempted = all.filter((q) => q.best_score !== null)
    const avg = attempted.length ? Math.round(attempted.reduce((sum, q) => sum + (q.best_score ?? 0), 0) / attempted.length) : null
    const cleared = all.filter((q) => (q.best_score ?? 0) >= 80).length
    return { total: all.length, attempted: attempted.length, avg, cleared }
  }, [questions])

  const visible = useMemo(() => {
    if (tab === 'quiz') return []
    return (questions ?? [])
      .filter((q) => q.category === tab && (difficulty === 'all' || q.difficulty === difficulty))
      .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty])
  }, [questions, tab, difficulty])

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

      {/* Role picker */}
      <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:flex-wrap" role="radiogroup" aria-label="Role">
          {roles.map((r) => (
            <button
              key={r.slug}
              role="radio"
              aria-checked={role === r.slug}
              onClick={() => setRole(r.slug)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${role === r.slug ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate-600 hover:border-slate-400'}`}
            >
              {r.title}
            </button>
          ))}
        </div>
      </div>

      {/* Role stats */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Attempted', value: questions ? `${summary.attempted}/${summary.total}` : '–' },
          { label: 'Average best', value: summary.avg === null ? '–' : `${summary.avg}`, tone: summary.avg === null ? '' : scoreTone(summary.avg).text },
          { label: 'Cleared (80+)', value: questions ? `${summary.cleared}` : '–' },
          { label: 'Quiz length', value: `${QUIZ_SIZE} Qs` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white px-4 py-3">
            <p className={`font-display text-2xl font-semibold leading-none ${stat.tone ?? ''}`}>{stat.value}</p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">{stat.label}</p>
          </div>
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
            <div className="rounded-3xl border border-line bg-gradient-to-br from-brand-soft via-white to-white p-6 text-center sm:p-10">
              <p className="eyebrow">Knowledge check</p>
              <h2 className="mt-2 text-2xl font-semibold">{QUIZ_SIZE} questions. New every session.</h2>
              <div className="mx-auto mt-5 grid max-w-xl gap-2 text-left sm:grid-cols-3">
                {[
                  ['Multiple choice', 'Four options per question'],
                  ['AI generated', 'Fresh set for your role'],
                  ['Full review', 'Answers and explanations'],
                ].map(([title, sub]) => (
                  <div key={title} className="rounded-xl border border-line bg-white/80 px-4 py-3">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
                  </div>
                ))}
              </div>
              <button onClick={startQuiz} disabled={!role || quizLoading} className="btn btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-50">
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
          <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Difficulty">
            {DIFFICULTY_FILTERS.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty === d}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${difficulty === d ? 'bg-ink text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {d}
              </button>
            ))}
            <span className="ml-auto font-mono text-[11px] text-slate-400">{visible.length} questions</span>
          </div>

          {!error && !questions && (
            <div className="mt-5 space-y-3" aria-label="Loading">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          )}
          {questions && visible.length === 0 && <p className="mt-8 text-sm text-slate-500">No questions match this filter.</p>}
          <div className="mt-4 space-y-3">
            {visible.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
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
