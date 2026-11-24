import { TECH_ICONS } from '../data/techIcons'

/** A technology's real logo, or a neutral code glyph when no logo exists. Decorative: the name sits beside it. */
export function TechIcon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
  const file = TECH_ICONS[name]
  if (file) {
    return <img src={`/tech-icons/${file}.svg`} alt="" loading="lazy" decoding="async" className={`${className} shrink-0 object-contain`} />
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} shrink-0 text-slate-500`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14" />
    </svg>
  )
}

/** The chip used wherever a technology is listed. Icons sit on a white tile so they read on the dark chip too. */
export function TechChip({ name, variant = '' }: { name: string; variant?: string }) {
  return (
    <span className={`chip gap-1.5 !pl-1.5 ${variant}`}>
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white">
        <TechIcon name={name} className="h-3 w-3" />
      </span>
      {name}
    </span>
  )
}
