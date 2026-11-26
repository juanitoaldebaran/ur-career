import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, getProfile, reviewCv, type CvReview } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import DropResume from '../components/cv-review/DropResume'
import ReviewResult from '../components/cv-review/ReviewResult'
import { CRITERIA } from '../lib/cvCriteria'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'

export default function CvReviewPage() {
  const { accessToken } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [role, setRole] = useState('')
  const [review, setReview] = useState<CvReview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Prefill from the profile, without overwriting anything already typed.
  useEffect(() => {
    if (!accessToken) return
    getProfile(accessToken)
      .then((p) => setRole((current) => current || p.target_role || ''))
      .catch(() => {
        // the field just stays empty
      })
  }, [accessToken])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!accessToken || !file || !role.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      setReview(await reviewCv(file, role.trim(), accessToken))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setReview(null)
    setFile(null)
    setError(null)
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      <header>
        <p className="eyebrow">CV review</p>
        <h1 className="mt-2 text-[2rem] font-semibold leading-tight sm:text-4xl">
          Score your CV against <span className="text-brand">your target role</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
          Upload a PDF and get a score out of 100 with a comment on each part. Your PDF is sent to Google Gemini to be
          scored. We save the score and feedback, not the file.
        </p>
      </header>

      {review ? (
        <ReviewResult review={review} onReset={reset} />
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
          <DropResume file={file} onChange={(next) => { setFile(next); setError(null) }} disabled={loading} />

          <div>
            <TextField label="Target role" value={role} onChange={setRole} placeholder="Backend engineer" required />

            <button type="submit" disabled={!file || !role.trim() || loading} className="btn btn-primary mt-4 min-h-11 w-full">
              {loading && <Spinner />}
              {loading ? 'Scoring your CV' : 'Score my CV'}
            </button>
            <p role="status" className="mt-2 min-h-5 text-sm text-slate-600">
              {loading ? 'This can take up to a minute.' : !file ? 'Add a PDF to continue.' : ''}
            </p>

            {error && (
              <p role="alert" className="mt-2 text-sm text-rose-700">
                Could not score your CV: {error}. Press "Score my CV" to try again.
              </p>
            )}

            <h2 className="mt-8 text-lg font-semibold">What gets scored</h2>
            <dl className="mt-3 border-t border-line">
              {Object.values(CRITERIA).map((c) => (
                <div key={c.label} className="flex items-baseline justify-between gap-6 border-b border-line py-3">
                  <div>
                    <dt className="font-medium">{c.label}</dt>
                    <dd className="mt-0.5 text-sm text-slate-600">{c.checks}</dd>
                  </div>
                  <dd className="shrink-0 font-mono text-xs text-slate-500">{c.max} points</dd>
                </div>
              ))}
            </dl>
          </div>
        </form>
      )}
    </div>
  )
}
