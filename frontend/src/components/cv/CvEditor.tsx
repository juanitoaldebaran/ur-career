import { useId, type ReactNode } from 'react'
import { Icon, type IconName } from '../icons'
import {
  LIMITS,
  emptyEducation,
  emptyExperience,
  emptyProject,
  emptySkillGroup,
  moveItem,
  removeAt,
  type CvData,
} from '../../lib/cv'

const patchAt = <T,>(list: T[], index: number, patch: Partial<T>): T[] =>
  list.map((item, i) => (i === index ? { ...item, ...patch } : item))

function Field({
  label,
  value,
  onChange,
  placeholder,
  className = '',
  maxLength = LIMITS.field,
  type = 'text',
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
  type?: string
  autoComplete?: string
}) {
  const id = useId()
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium text-slate-600">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input !py-2 !text-sm"
      />
    </div>
  )
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string
  icon: IconName
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 sm:h-9 sm:w-9 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent ${
        danger ? 'hover:!bg-red-50 hover:text-red-700' : 'hover:text-ink'
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
    </button>
  )
}

function EntryCard({
  name,
  fallback,
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  name: string
  fallback: string
  index: number
  count: number
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  children: ReactNode
}) {
  const title = name.trim() || `${fallback} ${index + 1}`
  return (
    <div className="rounded-2xl border border-line bg-white p-4 transition-colors focus-within:border-brand/50">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-ink">{title}</p>
        <div className="flex shrink-0 items-center">
          <IconButton label={`Move up: ${title}`} icon="up" disabled={index === 0} onClick={() => onMove(-1)} />
          <IconButton label={`Move down: ${title}`} icon="down" disabled={index === count - 1} onClick={() => onMove(1)} />
          <IconButton label={`Remove: ${title}`} icon="trash" danger onClick={onRemove} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-6">{children}</div>
    </div>
  )
}

function Bullets({ bullets, onChange }: { bullets: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="sm:col-span-6">
      <p className="text-xs font-medium text-slate-600">Bullet points</p>
      <ul className="mt-1.5 space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-1">
            <textarea
              aria-label={`Bullet point ${i + 1}`}
              rows={2}
              value={b}
              maxLength={LIMITS.bullet}
              placeholder="Start with a verb: what you did and the result"
              onChange={(e) => onChange(bullets.map((x, j) => (j === i ? e.target.value : x)))}
              className="input flex-1 resize-y !py-2 !text-sm"
            />
            <IconButton label={`Remove bullet point ${i + 1}`} icon="trash" danger onClick={() => onChange(removeAt(bullets, i))} />
          </li>
        ))}
      </ul>
      {bullets.length < LIMITS.bullets && (
        <button
          type="button"
          onClick={() => onChange([...bullets, ''])}
          className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add bullet point
        </button>
      )}
    </div>
  )
}

function Section({
  step,
  title,
  hint,
  children,
  onAdd,
  addLabel,
  canAdd = true,
}: {
  step: number
  title: string
  hint?: string
  children: ReactNode
  onAdd?: () => void
  addLabel?: string
  canAdd?: boolean
}) {
  return (
    <section className="space-y-4 pt-8 first:pt-0">
      <div>
        <p className="font-mono text-[11px] tabular-nums text-brand">0{step}</p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        {hint && <p className="mt-1 text-sm text-slate-600">{hint}</p>}
      </div>
      {children}
      {onAdd && (
        <button type="button" onClick={onAdd} disabled={!canAdd} className="btn btn-ghost !text-sm disabled:opacity-50">
          <Icon name="plus" className="h-4 w-4" />
          {canAdd ? addLabel : 'Limit reached'}
        </button>
      )}
    </section>
  )
}

export default function CvEditor({ data, onChange }: { data: CvData; onChange: (next: CvData) => void }) {
  const set = <K extends keyof CvData>(key: K, value: CvData[K]) => onChange({ ...data, [key]: value })
  const setBasics = (patch: Partial<CvData['basics']>) => set('basics', { ...data.basics, ...patch })
  const b = data.basics

  return (
    <div className="divide-y divide-line">
      <Section step={1} title="Your details" hint="Shown at the top of your CV.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" value={b.name} onChange={(v) => setBasics({ name: v })} autoComplete="name" className="sm:col-span-2" />
          <Field label="Phone" value={b.phone} onChange={(v) => setBasics({ phone: v })} autoComplete="tel" />
          <Field label="Email" type="email" value={b.email} onChange={(v) => setBasics({ email: v })} autoComplete="email" />
          <Field label="LinkedIn" value={b.linkedin} onChange={(v) => setBasics({ linkedin: v })} placeholder="linkedin.com/in/yourname" />
          <Field label="GitHub" value={b.github} onChange={(v) => setBasics({ github: v })} placeholder="github.com/yourname" />
          <Field label="Website (optional)" value={b.website} onChange={(v) => setBasics({ website: v })} placeholder="yoursite.com" className="sm:col-span-2" />
        </div>
      </Section>

      <Section
        step={2}
        title="Education"
        onAdd={() => set('education', [...data.education, emptyEducation()])}
        addLabel="Add education"
        canAdd={data.education.length < LIMITS.education}
      >
        {data.education.map((e, i) => {
          const up = (patch: Partial<typeof e>) => set('education', patchAt(data.education, i, patch))
          return (
            <EntryCard
              key={e.id}
              name={e.school}
              fallback="Education"
              index={i}
              count={data.education.length}
              onMove={(d) => set('education', moveItem(data.education, i, d))}
              onRemove={() => set('education', removeAt(data.education, i))}
            >
              <Field label="School" value={e.school} onChange={(v) => up({ school: v })} className="sm:col-span-4" />
              <Field label="Location" value={e.location} onChange={(v) => up({ location: v })} placeholder="City, Country" className="sm:col-span-2" />
              <Field label="Degree" value={e.degree} onChange={(v) => up({ degree: v })} placeholder="BSc in Computer Science" className="sm:col-span-6" />
              <Field label="Start" value={e.start} onChange={(v) => up({ start: v })} placeholder="Aug. 2018" className="sm:col-span-3" />
              <Field label="End" value={e.end} onChange={(v) => up({ end: v })} placeholder="May 2021" className="sm:col-span-3" />
            </EntryCard>
          )
        })}
      </Section>

      <Section
        step={3}
        title="Experience"
        onAdd={() => set('experience', [...data.experience, emptyExperience()])}
        addLabel="Add experience"
        canAdd={data.experience.length < LIMITS.experience}
      >
        {data.experience.map((e, i) => {
          const up = (patch: Partial<typeof e>) => set('experience', patchAt(data.experience, i, patch))
          return (
            <EntryCard
              key={e.id}
              name={e.role}
              fallback="Experience"
              index={i}
              count={data.experience.length}
              onMove={(d) => set('experience', moveItem(data.experience, i, d))}
              onRemove={() => set('experience', removeAt(data.experience, i))}
            >
              <Field label="Role" value={e.role} onChange={(v) => up({ role: v })} placeholder="Software Engineer" className="sm:col-span-3" />
              <Field label="Company" value={e.company} onChange={(v) => up({ company: v })} className="sm:col-span-3" />
              <Field label="Location" value={e.location} onChange={(v) => up({ location: v })} placeholder="City, Country" className="sm:col-span-2" />
              <Field label="Start" value={e.start} onChange={(v) => up({ start: v })} placeholder="June 2020" className="sm:col-span-2" />
              <Field label="End" value={e.end} onChange={(v) => up({ end: v })} placeholder="Present" className="sm:col-span-2" />
              <Bullets bullets={e.bullets} onChange={(bullets) => up({ bullets })} />
            </EntryCard>
          )
        })}
      </Section>

      <Section
        step={4}
        title="Projects"
        onAdd={() => set('projects', [...data.projects, emptyProject()])}
        addLabel="Add project"
        canAdd={data.projects.length < LIMITS.projects}
      >
        {data.projects.map((p, i) => {
          const up = (patch: Partial<typeof p>) => set('projects', patchAt(data.projects, i, patch))
          return (
            <EntryCard
              key={p.id}
              name={p.name}
              fallback="Project"
              index={i}
              count={data.projects.length}
              onMove={(d) => set('projects', moveItem(data.projects, i, d))}
              onRemove={() => set('projects', removeAt(data.projects, i))}
            >
              <Field label="Project name" value={p.name} onChange={(v) => up({ name: v })} className="sm:col-span-3" />
              <Field label="Technologies" value={p.stack} onChange={(v) => up({ stack: v })} placeholder="Go, React, PostgreSQL" className="sm:col-span-3" />
              <Field label="Start" value={p.start} onChange={(v) => up({ start: v })} className="sm:col-span-3" />
              <Field label="End" value={p.end} onChange={(v) => up({ end: v })} placeholder="Present" className="sm:col-span-3" />
              <Bullets bullets={p.bullets} onChange={(bullets) => up({ bullets })} />
            </EntryCard>
          )
        })}
      </Section>

      <Section
        step={5}
        title="Technical skills"
        hint="Group them however you like. Each group is one line on your CV."
        onAdd={() => set('skills', [...data.skills, emptySkillGroup()])}
        addLabel="Add skill group"
        canAdd={data.skills.length < LIMITS.skillGroups}
      >
        <div className="space-y-3">
          {data.skills.map((s, i) => (
            <div key={s.id} className="grid items-end gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
              <Field
                label="Group"
                value={s.label}
                onChange={(v) => set('skills', patchAt(data.skills, i, { label: v }))}
                placeholder="Languages"
              />
              <Field
                label="Skills (comma separated)"
                value={s.items}
                maxLength={LIMITS.skills}
                onChange={(v) => set('skills', patchAt(data.skills, i, { items: v }))}
                placeholder="Go, Python, SQL"
              />
              <IconButton
                label={`Remove skill group: ${s.label.trim() || i + 1}`}
                icon="trash"
                danger
                onClick={() => set('skills', removeAt(data.skills, i))}
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
