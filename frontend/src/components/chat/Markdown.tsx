import { memo, type ReactNode } from 'react'

// A small, safe Markdown renderer for assistant replies. It only ever builds React
// elements (never HTML strings), so model output cannot inject markup. Links are
// limited to http(s). Supports: paragraphs, headings, bullet/numbered lists,
// fenced code, **bold**, `code` and [text](url). Streaming-safe: an unfinished
// code fence just renders as code until the closing fence arrives.

const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g
const LINK = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/

function inline(text: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part, i) => {
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        )
      }
      const link = LINK.exec(part)
      if (link) {
        return (
          <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline-offset-2 hover:underline">
            {link[1]}
          </a>
        )
      }
      return part
    })
}

const FENCE = /^\s*```/
const HEADING = /^#{1,4}\s+(.*)$/
const BULLET = /^\s*[-*]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/

function blocks(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const out: ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i++
      continue
    }

    if (FENCE.test(line)) {
      const code: string[] = []
      i++
      while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++])
      i++ // closing fence (or end of text while still streaming)
      out.push(
        <pre key={out.length} tabIndex={0} className="overflow-x-auto rounded-xl border border-line bg-slate-50 p-4 text-[13px] leading-relaxed">
          <code className="font-mono">{code.join('\n')}</code>
        </pre>,
      )
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      out.push(
        <h3 key={out.length} className="font-display text-base font-semibold">
          {inline(heading[1])}
        </h3>,
      )
      i++
      continue
    }

    const list = BULLET.test(line) ? BULLET : NUMBERED.test(line) ? NUMBERED : null
    if (list) {
      const items: string[] = []
      while (i < lines.length && list.test(lines[i])) items.push(list.exec(lines[i++])![1])
      const Tag = list === BULLET ? 'ul' : 'ol'
      out.push(
        <Tag key={out.length} className={`space-y-1.5 pl-5 ${Tag === 'ul' ? 'list-disc' : 'list-decimal'} marker:text-slate-400`}>
          {items.map((item, n) => (
            <li key={n}>{inline(item)}</li>
          ))}
        </Tag>,
      )
      continue
    }

    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !FENCE.test(lines[i]) &&
      !HEADING.test(lines[i]) &&
      !BULLET.test(lines[i]) &&
      !NUMBERED.test(lines[i])
    ) {
      para.push(lines[i++])
    }
    out.push(
      <p key={out.length} className="whitespace-pre-line">
        {inline(para.join('\n'))}
      </p>,
    )
  }

  return out
}

function Markdown({ text }: { text: string }) {
  return <div className="space-y-4 break-words text-base leading-[1.7] text-ink">{blocks(text)}</div>
}

export default memo(Markdown)
