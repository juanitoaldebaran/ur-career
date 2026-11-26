import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { Icon } from '../icons'

export const MAX_FILE_BYTES = 2 * 1024 * 1024

function checkFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'That file is not a PDF. Export your CV as a PDF and try again.'
  if (file.size > MAX_FILE_BYTES) return 'That file is over 2 MB. Export a smaller PDF and try again.'
  return null
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** A page-shaped drop target. The server checks the file again; this only gives fast feedback. */
export default function DropResume({
  file,
  onChange,
  disabled,
}: {
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Without this, a file dropped just outside the sheet makes the browser leave the app to open it.
  useEffect(() => {
    const block = (event: Event) => event.preventDefault()
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])

  function take(files: FileList | null) {
    const next = files?.[0]
    if (!next) return
    const problem = files.length > 1 ? 'Drop one PDF at a time.' : checkFile(next)
    setError(problem)
    onChange(problem ? null : next)
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    setOver(false)
    if (!disabled) take(event.dataTransfer.files)
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setOver(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false)
        }}
        onDrop={handleDrop}
        className={`flex min-h-80 w-full flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors lg:aspect-[4/5] ${
          over ? 'border-brand bg-brand-soft' : error ? 'border-rose-400' : file ? 'border-brand' : 'border-slate-300 hover:border-brand'
        }`}
      >
        <Icon name={file ? 'file' : 'upload'} className="h-10 w-10 text-brand" />
        {file ? (
          <div className="max-w-full">
            <p className="break-all font-medium">{file.name}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">{formatSize(file.size)}</p>
          </div>
        ) : (
          <div>
            <p className="font-display text-2xl font-semibold">{over ? 'Let go to add it' : 'Drop your resume here'}</p>
            <p className="mt-1.5 text-sm text-slate-600">PDF, up to 2 MB</p>
          </div>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-describedby={error ? errorId : undefined}
          className="btn btn-ghost min-h-11"
        >
          {file ? 'Choose a different file' : 'Choose file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            take(e.target.files)
            e.target.value = '' // lets the same file be picked again
          }}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}
