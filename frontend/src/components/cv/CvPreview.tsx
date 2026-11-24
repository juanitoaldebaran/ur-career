import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CvData } from '../../lib/cv'
import CvDocument from './CvDocument'

const PAGE_W = 816 // 8.5in at 96dpi
const PAGE_H = 1056 // 11in

// Shows the resume as a US Letter page, scaled down to fit the pane. A dashed line marks
// where page 2 would start, and the page count is reported so the toolbar can warn.
export default function CvPreview({ data, onPages }: { data: CvData; onPages: (pages: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const doc = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(PAGE_H)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      if (width > 0) setScale(Math.min(1, width / PAGE_W))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = doc.current
    if (!el) return
    // Layout size, so the page's own scale transform does not affect it.
    const ro = new ResizeObserver(() => setHeight(Math.max(PAGE_H, Math.ceil(el.offsetHeight))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pages = Math.ceil((height - 1) / PAGE_H)
  useEffect(() => onPages(pages), [pages, onPages])

  return (
    <div ref={wrap} className="w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-md border border-line bg-white"
        style={{ width: PAGE_W * scale, height: height * scale }}
      >
        <div ref={doc} style={{ width: PAGE_W, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <CvDocument data={data} />
        </div>
        {Array.from({ length: pages - 1 }, (_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-brand/50"
            style={{ top: PAGE_H * (i + 1) * scale }}
          >
            <span className="absolute right-2 top-1 rounded bg-brand-soft px-1.5 py-0.5 font-mono text-[10px] text-brand">
              Page {i + 2}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
