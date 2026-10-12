import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { ApiError } from '../lib/api'
import AuthShell from '../components/AuthShell'
import PasswordField from '../components/PasswordField'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const passwordsMatch = password === confirmPassword && password.length > 0
  const passwordsMismatch = password !== confirmPassword && confirmPassword.length > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await register(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building your career path in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField label="Email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={setEmail} />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          minLength={8}
          helperText="At least 8 characters."
        />
        <div className="flex flex-col gap-1.5">
          <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" required />
          {passwordsMatch && <p className="text-xs text-brand">Passwords match.</p>}
          {passwordsMismatch && <p className="text-xs text-red-600">Passwords do not match.</p>}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary mt-1 w-full">
          {submitting && <Spinner />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
