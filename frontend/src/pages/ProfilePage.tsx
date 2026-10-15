import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/AuthContext'
import { ApiError, getProfile, updateProfile, type Profile } from '../lib/api'
import Spinner from '../components/Spinner'
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

                <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1 rounded-xl border border-line p-4">
                    <Field label="Current job" value={profile?.current_role} placeholder="Not set" />
                  </div>
                  <span className="hidden text-slate-300 sm:block" aria-hidden="true">
                    →
                  </span>
                  <div className="flex-1 rounded-xl border border-brand/30 bg-brand-soft p-4">
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
                    className="mt-6 rounded-xl bg-ink p-5 text-white"
                  >
                    {justSaved && <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-blue-300">Profile saved</p>}
                    {targetRoadmap ? (
                      <>
                        <p className="text-sm text-slate-300">Your path to {profile?.target_role}</p>
                        <p className="mt-1 font-display text-lg font-semibold">{targetRoadmap.title} roadmap</p>
                        <Link to={`/roadmap/${targetRoadmap.slug}`} className="btn mt-4 bg-white !py-2 text-ink hover:bg-brand-soft">
                          Go to my target roadmap →
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-300">
                          We don&apos;t have a roadmap for &ldquo;{profile?.target_role}&rdquo; yet.
                        </p>
                        <Link to="/roadmap" className="btn mt-4 bg-white !py-2 text-ink hover:bg-brand-soft">
                          Browse all roadmaps →
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
