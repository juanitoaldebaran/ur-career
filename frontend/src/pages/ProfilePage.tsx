import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import { ApiError, getProfile, getProfileStats, updateProfile, type Profile, type ProfileStats } from '../lib/api'
import Spinner from '../components/Spinner'
import ScoreRing from '../components/ScoreRing'
import { ROADMAP_TARGETS, findTargetRoadmap } from '../lib/targetRoadmap'
import TextField from '../components/TextField'

const EASE = [0.22, 1, 0.36, 1] as const

function Field({ label, value, placeholder }: { label: string; value?: string; placeholder: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-[15px] ${value ? 'font-medium text-ink' : 'text-slate-400'}`}>{value || placeholder}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { user, accessToken } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [statsLoaded, setStatsLoaded] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    getProfile(accessToken)
      .then(setProfile)
      .catch((err) => {
        // 404 just means the user has not filled in a profile yet.
        if (!(err instanceof ApiError && err.status === 404)) setLoadError('Could not load your profile.')
      })
      .finally(() => setLoaded(true))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return
    getProfileStats(accessToken)
      .then(setStats)
      .catch(() => setStatsError('Could not load your progress.'))
      .finally(() => setStatsLoaded(true))
  }, [accessToken])

  function startEditing() {
    setFullName(profile?.full_name ?? '')
    setCurrentRole(profile?.current_role ?? '')
    setTargetRole(profile?.target_role ?? '')
    setSaveError(null)
    setJustSaved(false)
    setEditing(true)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setSaving(true)
    setSaveError(null)
    try {
      setProfile(await updateProfile({ full_name: fullName, current_role: currentRole, target_role: targetRole }, accessToken))
      setEditing(false)
      setJustSaved(true)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const displayName = profile?.full_name || user.email.split('@')[0]
  const initial = displayName.charAt(0).toUpperCase()
  const isEmpty = loaded && !loadError && !profile
  const targetRoadmap = findTargetRoadmap(profile?.target_role)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Your profile</h1>
      </motion.div>

      {loadError && <p className="mt-8 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}
      {!loaded && <p className="mt-8 text-sm text-slate-400">Loading…</p>}

      {loaded && !loadError && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="mt-8 overflow-hidden rounded-2xl border border-line bg-white"
        >
          <div className="flex items-center gap-4 border-b border-line p-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink font-display text-2xl font-semibold text-white">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold">{displayName}</h2>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
            {!editing && (
              <button onClick={startEditing} className="btn btn-ghost !px-4 !py-2">
                {isEmpty ? 'Set up' : 'Edit'}
              </button>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <motion.form
                key="form"
                onSubmit={handleSave}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5 p-6"
              >
                <TextField label="Full name" autoComplete="name" placeholder="Jane Doe" value={fullName} onChange={setFullName} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField label="Current job" placeholder="e.g. Junior Developer" required value={currentRole} onChange={setCurrentRole} />
                  <TextField label="Target job" placeholder="e.g. Backend Engineer" required list="target-jobs" value={targetRole} onChange={setTargetRole} />
                  <datalist id="target-jobs">
                    {ROADMAP_TARGETS.map((t) => (
                      <option key={t.slug} value={t.title} />
                    ))}
                  </datalist>
                </div>

                {saveError && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {saveError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving && <Spinner />}
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost">
                    Cancel
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-6"
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Full name" value={profile?.full_name} placeholder="Not set" />
                  <Field label="Email" value={user.email} placeholder="" />
                </div>

                <div className="mt-6 flex items-center gap-4 border-t border-line pt-6">
                  <div className="flex-1">
                    <Field label="Current job" value={profile?.current_role} placeholder="Not set" />
                  </div>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                  <div className="flex-1">
                    <Field label="Target job" value={profile?.target_role} placeholder="Not set" />
                  </div>
                </div>

                {isEmpty ? (
                  <p className="mt-6 text-sm text-slate-500">
                    Add your name and jobs so your roadmaps and coaching can fit where you are heading.
                  </p>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
                    className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5"
                  >
                    <div>
                      {justSaved && <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-brand">Profile saved</p>}
                      {targetRoadmap ? (
                        <>
                          <p className="text-sm text-slate-500">Your path to {profile?.target_role}</p>
                          <p className="mt-0.5 font-medium text-ink">{targetRoadmap.title} roadmap</p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No roadmap yet for &ldquo;{profile?.target_role}&rdquo;.
                        </p>
                      )}
                    </div>
                    <Link
                      to={targetRoadmap ? `/roadmap/${targetRoadmap.slug}` : '/roadmap'}
                      className="shrink-0 text-sm font-medium text-brand hover:underline"
                    >
                      {targetRoadmap ? 'Go to roadmap' : 'Browse roadmaps'} →
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        className="mt-10"
      >
        <p className="eyebrow">Progress</p>
        <h2 className="mt-2 text-2xl font-semibold">How you&apos;re doing</h2>

        {statsError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{statsError}</p>}
        {!statsLoaded && <p className="mt-4 text-sm text-slate-400">Loading…</p>}

        {statsLoaded && !statsError && stats && (
          <div className="mt-6 flex flex-col gap-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Best score</p>
              <div className="mt-3 grid grid-cols-2 divide-x divide-line overflow-hidden rounded-2xl border border-line bg-white">
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <ScoreRing score={stats.quiz.best_score} />
                  <p className="text-sm font-medium text-ink">Quiz</p>
                  {stats.quiz.total_taken === 0 && (
                    <Link to="/practice" className="text-sm font-medium text-brand hover:underline">
                      Take a quiz →
                    </Link>
                  )}
                </div>
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <ScoreRing score={stats.practice.best_score} />
                  <p className="text-sm font-medium text-ink">Practice</p>
                  {stats.practice.total_attempts === 0 && (
                    <Link to="/practice" className="text-sm font-medium text-brand hover:underline">
                      Start practicing →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Average score</p>
              <div className="mt-3 grid grid-cols-2 divide-x divide-line overflow-hidden rounded-2xl border border-line bg-white">
                <div className="p-6 text-center">
                  <p className="font-display text-3xl font-semibold text-ink">
                    {stats.quiz.total_taken > 0 ? stats.quiz.average_score : '—'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Quiz · {stats.quiz.total_taken} taken
                  </p>
                </div>
                <div className="p-6 text-center">
                  <p className="font-display text-3xl font-semibold text-ink">
                    {stats.practice.total_attempts > 0 ? stats.practice.average_score : '—'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Practice · {stats.practice.total_attempts} attempts
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Roadmap progress</p>
              <div className="mt-3 rounded-2xl border border-line bg-white p-6">
                {stats.roadmaps.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No roadmap started yet.{' '}
                    <Link to="/roadmap" className="font-medium text-brand hover:underline">
                      Explore roadmaps →
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {stats.roadmaps.map((r) => {
                      const percent = r.total_nodes > 0 ? Math.round((r.done_nodes / r.total_nodes) * 100) : 0
                      return (
                        <Link key={r.slug} to={`/roadmap/${r.slug}`} className="group block">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-ink group-hover:text-brand">{r.title}</span>
                            <span className="font-mono text-xs text-slate-400">{percent}%</span>
                          </div>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.8, ease: EASE }}
                              className="h-full rounded-full bg-ink"
                            />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
