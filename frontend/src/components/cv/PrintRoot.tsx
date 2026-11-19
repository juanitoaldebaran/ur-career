import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CvData } from '../../lib/cv'
import CvDocument from './CvDocument'

// "Download PDF" uses the browser's print dialog. The resume is rendered into its own
// element on <body>, and the print stylesheet hides the whole app except that element,
// so the printout is only the CV, at full size, with real selectable text (ATS friendly).
export default function PrintRoot({ data }: { data: CvData }) {
  const [host] = useState(() => {
    const el = document.createElement('div')
    el.id = 'cv-print-root'
    return el
  })

  useEffect(() => {
    document.body.appendChild(host)
    return () => {
      host.remove()
    }
  }, [host])

  return createPortal(<CvDocument data={data} print />, host)
}
