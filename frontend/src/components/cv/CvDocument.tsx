import { Fragment, type CSSProperties, type ReactNode } from 'react'
import {
  cleanBullets,
  contactItems,
  dateRange,
  hasEducation,
  hasExperience,
  hasProject,
  type CvData,
} from '../../lib/cv'

// The resume itself, laid out like the "Jake's Resume" LaTeX template on US Letter.
// The same component draws the on-screen preview and the printed page, so what you
// see is what "Download PDF" prints. Sizes are in pt/in so they match print exactly.

const serif: CSSProperties = { fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: '9pt' }}>
      <h2
        style={{
          fontFamily: 'inherit', // the app styles h1-h3 with its display font; the resume stays serif
          letterSpacing: 'normal',
          fontVariant: 'small-caps',
          fontSize: '13pt',
          fontWeight: 400,
          lineHeight: 1.15,
          borderBottom: '0.8pt solid #000',
          paddingBottom: '1pt',
          marginBottom: '3pt',
        }}
      >
        {title}
      </h2>
      <div style={{ paddingLeft: '0.15in' }}>{children}</div>
    </section>
  )
}

function Row({ left, right, italic }: { left: ReactNode; right: ReactNode; italic?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12pt',
        fontSize: italic ? '10pt' : undefined,
        fontStyle: italic ? 'italic' : undefined,
        lineHeight: 1.3,
      }}
    >
      <span>{left}</span>
      <span style={{ whiteSpace: 'nowrap' }}>{right}</span>
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  const list = cleanBullets(items)
  if (list.length === 0) return null
  return (
    <ul style={{ listStyleType: 'disc', marginLeft: '0.22in', paddingLeft: '0.12in', fontSize: '10pt', lineHeight: 1.3, marginTop: '1pt' }}>
      {list.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  )
}

export default function CvDocument({ data, print = false }: { data: CvData; print?: boolean }) {
  const { basics } = data
  const contact = contactItems(basics)
  const education = data.education.filter(hasEducation)
  const experience = data.experience.filter(hasExperience)
  const projects = data.projects.filter(hasProject)
  const skills = data.skills.filter((s) => s.items.trim())

  return (
    <div
      style={{
        ...serif,
        width: '8.5in',
        minHeight: print ? undefined : '11in',
        boxSizing: 'border-box',
        padding: '0.5in',
        fontSize: '11pt',
        lineHeight: 1.25,
        background: '#fff',
        color: '#000',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'inherit', letterSpacing: 'normal', fontSize: '25pt', fontWeight: 700, fontVariant: 'small-caps', lineHeight: 1.1 }}>
          {basics.name.trim() || 'Your Name'}
        </h1>
        {contact.length > 0 && (
          <p style={{ fontSize: '10pt', marginTop: '2pt' }}>
            {contact.map((c, i) => (
              <Fragment key={i}>
                {i > 0 && ' | '}
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>
                    {c.text}
                  </a>
                ) : (
                  c.text
                )}
              </Fragment>
            ))}
          </p>
        )}
      </header>

      {education.length > 0 && (
        <Section title="Education">
          {education.map((e) => (
            <div key={e.id} style={{ marginTop: '2pt', breakInside: 'avoid' }}>
              <Row left={<strong>{e.school}</strong>} right={e.location} />
              <Row italic left={e.degree} right={dateRange(e.start, e.end, ' – ')} />
            </div>
          ))}
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Experience">
          {experience.map((e) => (
            <div key={e.id} style={{ marginTop: '3pt', breakInside: 'avoid' }}>
              <Row left={<strong>{e.role}</strong>} right={dateRange(e.start, e.end, ' – ')} />
              <Row italic left={e.company} right={e.location} />
              <Bullets items={e.bullets} />
            </div>
          ))}
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p) => (
            <div key={p.id} style={{ marginTop: '3pt', breakInside: 'avoid' }}>
              <Row
                left={
                  <span style={{ fontSize: '10pt' }}>
                    <strong>{p.name}</strong>
                    {p.stack.trim() && (
                      <>
                        {' | '}
                        <em>{p.stack}</em>
                      </>
                    )}
                  </span>
                }
                right={dateRange(p.start, p.end, ' – ')}
              />
              <Bullets items={p.bullets} />
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Technical Skills">
          <div style={{ fontSize: '10pt', lineHeight: 1.3 }}>
            {skills.map((s) => (
              <p key={s.id}>
                <strong>{s.label.trim() || 'Skills'}</strong>: {s.items}
              </p>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
