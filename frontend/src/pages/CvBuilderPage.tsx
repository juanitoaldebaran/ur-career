import { useCallback, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useCv } from '../hooks/useCv'
import { cvFileName, cvToLatex, isCvEmpty } from '../lib/cv'
import { Icon } from '../components/icons'
import CvEditor from '../components/cv/CvEditor'
import CvPreview from '../components/cv/CvPreview'
import PrintRoot from '../components/cv/PrintRoot'

type Tab = 'edit' | 'preview'
type Pending = 'example' | 'clear' | null

export default function CvBuilderPage() {
  const { user } = useAuth()
  const { data, setData, saveState, reset, loadExample } = useCv(user?.user_id ?? 'anonymous', user?.email ?? '')
  const [tab, setTab] = useState<Tab>('edit')
  const [pages, setPages] = useState(1)
  const [pending, setPending] = useState<Pending>(null)
  const onPages = useCallback((n: number) => setPages(n), [])

  const empty = isCvEmpty(data)

  function ask(kind: Exclude<Pending, null>) {
    if (empty) run(kind) // nothing to lose, so no confirmation
    else setPending(kind)
  }
  function run(kind: Exclude<Pending, null>) {
    if (kind === 'example') loadExample()
    else reset()
    setPending(null)
  }

  // The browser's print dialog saves a text-based PDF. Its title becomes the file name.
  function downloadPdf() {
    const previous = document.title
    document.title = cvFileName(data, 'pdf').replace(/\.pdf$/, '')
    const restore = () => {
      document.title = previous
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
  }

  function downloadTex() {
    const blob = new Blob([cvToLatex(data)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = cvFileName(data, 'tex')
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CV Builder</p>
          <h1 className="mt-2 text-[2rem] font-semibold leading-tight sm:text-4xl">
            Build a <span className="text-brand">one-page CV</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Fill in your details and get a clean, ATS-friendly CV in the classic Jake&apos;s Resume layout. It is saved in
            this browser only and never sent to our servers.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button type="button" onClick={downloadPdf} className="btn btn-primary">
            <Icon name="printer" className="h-4 w-4" />
            Download PDF
          </button>
          <button type="button" onClick={downloadTex} className="btn btn-ghost">
            <Icon name="download" className="h-4 w-4" />
            LaTeX (.tex)
          </button>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-y border-line py-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500" role="status">
            {saveState === 'saving' ? 'Saving…' : 'Saved in this browser'}
          </span>
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 font-medium ${pages === 1 ? 'text-ink' : 'text-red-700'}`}
          >
            {pages === 1 ? (
              <>
                <Icon name="check" className="h-4 w-4 text-brand" />
                Fits on one page
              </>
            ) : (
              `${pages} pages. Trim it to fit one page.`
            )}
          </span>
        </div>

        {pending ? (
          <div className="flex items-center gap-2" role="alert">
            <span className="text-slate-700">
              {pending === 'example' ? 'Replace your CV with the example?' : 'Clear everything?'}
            </span>
            <button
              type="button"
              onClick={() => run(pending)}
              className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              {pending === 'example' ? 'Replace' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => ask('example')}
              className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
            >
              Load example
            </button>
            <button
              type="button"
              onClick={() => ask('clear')}
              disabled={empty}
              className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="sticky top-[5.25rem] z-10 -mx-4 mt-4 bg-white px-4 py-2 sm:-mx-6 sm:px-6 lg:hidden"><div className="flex rounded-full bg-slate-100 p-1" role="group" aria-label="View">
        {(['edit', 'preview'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`min-h-10 flex-1 rounded-full text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-ink text-white' : 'text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div></div>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className={tab === 'edit' ? '' : 'hidden lg:block'}>
          <CvEditor data={data} onChange={setData} />
        </div>
        <div className={`${tab === 'preview' ? '' : 'hidden lg:block'} lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-line lg:bg-slate-50 lg:p-5`}>
          <CvPreview data={data} onPages={onPages} />
        </div>
      </div>

      <PrintRoot data={data} />
    </div>
  )
}
