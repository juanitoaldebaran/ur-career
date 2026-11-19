// CV data model, helpers and the LaTeX generator for the "Jake's Resume" layout.
// Everything here is pure (no React, no browser APIs except crypto for ids), so it is easy to test.

export interface Basics {
  name: string
  phone: string
  email: string
  linkedin: string
  github: string
  website: string
}
export interface EducationItem {
  id: string
  school: string
  location: string
  degree: string
  start: string
  end: string
}
export interface ExperienceItem {
  id: string
  role: string
  company: string
  location: string
  start: string
  end: string
  bullets: string[]
}
export interface ProjectItem {
  id: string
  name: string
  stack: string
  start: string
  end: string
  bullets: string[]
}
export interface SkillGroup {
  id: string
  label: string
  items: string
}
export interface CvData {
  basics: Basics
  education: EducationItem[]
  experience: ExperienceItem[]
  projects: ProjectItem[]
  skills: SkillGroup[]
}

// Limits keep saved data and the generated LaTeX bounded.
export const LIMITS = {
  field: 200,
  bullet: 400,
  skills: 600,
  education: 6,
  experience: 10,
  projects: 10,
  skillGroups: 8,
  bullets: 8,
}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)

export const emptyEducation = (): EducationItem => ({ id: newId(), school: '', location: '', degree: '', start: '', end: '' })
export const emptyExperience = (): ExperienceItem => ({
  id: newId(),
  role: '',
  company: '',
  location: '',
  start: '',
  end: '',
  bullets: [''],
})
export const emptyProject = (): ProjectItem => ({ id: newId(), name: '', stack: '', start: '', end: '', bullets: [''] })
export const emptySkillGroup = (label = ''): SkillGroup => ({ id: newId(), label, items: '' })

export function blankCv(email = ''): CvData {
  return {
    basics: { name: '', phone: '', email, linkedin: '', github: '', website: '' },
    education: [emptyEducation()],
    experience: [emptyExperience()],
    projects: [emptyProject()],
    skills: ['Languages', 'Frameworks', 'Developer Tools', 'Libraries'].map(emptySkillGroup),
  }
}

// ---------- list helpers ----------

export function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
export const removeAt = <T>(list: T[], index: number): T[] => list.filter((_, i) => i !== index)
export const replaceAt = <T>(list: T[], index: number, value: T): T[] => list.map((v, i) => (i === index ? value : v))

// ---------- reading saved data safely ----------

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const id = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 64) : newId())
const bullets = (v: unknown) => arr(v).slice(0, LIMITS.bullets).map((b) => str(b, LIMITS.bullet))

// Saved JSON can be stale or hand-edited, so rebuild every field instead of trusting it.
export function normalizeCv(raw: unknown, fallbackEmail = ''): CvData {
  const r = obj(raw)
  const b = obj(r.basics)
  const f = LIMITS.field
  return {
    basics: {
      name: str(b.name, f),
      phone: str(b.phone, f),
      email: str(b.email, f) || fallbackEmail,
      linkedin: str(b.linkedin, f),
      github: str(b.github, f),
      website: str(b.website, f),
    },
    education: arr(r.education).slice(0, LIMITS.education).map((e) => {
      const o = obj(e)
      return { id: id(o.id), school: str(o.school, f), location: str(o.location, f), degree: str(o.degree, f), start: str(o.start, f), end: str(o.end, f) }
    }),
    experience: arr(r.experience).slice(0, LIMITS.experience).map((e) => {
      const o = obj(e)
      return {
        id: id(o.id),
        role: str(o.role, f),
        company: str(o.company, f),
        location: str(o.location, f),
        start: str(o.start, f),
        end: str(o.end, f),
        bullets: bullets(o.bullets),
      }
    }),
    projects: arr(r.projects).slice(0, LIMITS.projects).map((e) => {
      const o = obj(e)
      return { id: id(o.id), name: str(o.name, f), stack: str(o.stack, f), start: str(o.start, f), end: str(o.end, f), bullets: bullets(o.bullets) }
    }),
    skills: arr(r.skills).slice(0, LIMITS.skillGroups).map((e) => {
      const o = obj(e)
      return { id: id(o.id), label: str(o.label, f), items: str(o.items, LIMITS.skills) }
    }),
  }
}

// ---------- what to show ----------

const filled = (...values: string[]) => values.some((v) => v.trim() !== '')
export const hasEducation = (e: EducationItem) => filled(e.school, e.location, e.degree, e.start, e.end)
export const hasExperience = (e: ExperienceItem) => filled(e.role, e.company, e.location, e.start, e.end, ...e.bullets)
export const hasProject = (p: ProjectItem) => filled(p.name, p.stack, p.start, p.end, ...p.bullets)
export const hasSkill = (s: SkillGroup) => filled(s.label, s.items)
export const cleanBullets = (list: string[]) => list.map((b) => b.trim()).filter(Boolean)

export function isCvEmpty(d: CvData): boolean {
  const b = d.basics
  return (
    !filled(b.name, b.phone, b.linkedin, b.github, b.website) &&
    !d.education.some(hasEducation) &&
    !d.experience.some(hasExperience) &&
    !d.projects.some(hasProject) &&
    !d.skills.some((s) => filled(s.items))
  )
}

export function dateRange(start: string, end: string, separator: string): string {
  const s = start.trim()
  const e = end.trim()
  return s && e ? `${s}${separator}${e}` : s || e
}

// ---------- links ----------

// Only http(s) and mailto links are ever produced, so a saved "javascript:..." can never become a link.
export function toHref(raw: string, kind: 'email' | 'web'): string | null {
  const v = raw.trim()
  if (!v) return null
  if (kind === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? `mailto:${v}` : null
  const withScheme = /^https?:\/\//i.test(v) ? v : /^[a-z][a-z0-9+.-]*:/i.test(v) ? null : `https://${v}`
  if (!withScheme) return null
  try {
    const u = new URL(withScheme)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch {
    return null
  }
}
export const displayUrl = (raw: string) => raw.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '')

export interface ContactItem {
  text: string
  href: string | null
}
export function contactItems(b: Basics): ContactItem[] {
  const items: ContactItem[] = []
  if (b.phone.trim()) items.push({ text: b.phone.trim(), href: null })
  if (b.email.trim()) items.push({ text: b.email.trim(), href: toHref(b.email, 'email') })
  if (b.linkedin.trim()) items.push({ text: displayUrl(b.linkedin), href: toHref(b.linkedin, 'web') })
  if (b.github.trim()) items.push({ text: displayUrl(b.github), href: toHref(b.github, 'web') })
  if (b.website.trim()) items.push({ text: displayUrl(b.website), href: toHref(b.website, 'web') })
  return items
}

// ---------- LaTeX ----------

const SPECIAL: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
  '<': '\\textless{}',
  '>': '\\textgreater{}',
  '|': '\\textbar{}',
}

// Escapes user text so it cannot inject LaTeX commands (a stray "\input{...}" must stay text).
export const texEscape = (s: string) =>
  s
    .replace(/[\\&%$#_{}~^<>|]/g, (c) => SPECIAL[c])
    .replace(/\s*[\r\n]+\s*/g, ' ')
    .trim()

const texUrl = (url: string) => url.replace(/[%#&]/g, (c) => `\\${c}`)

function texLink(item: ContactItem): string {
  const label = `\\underline{${texEscape(item.text)}}`
  return item.href ? `\\href{${texUrl(item.href)}}{${label}}` : texEscape(item.text)
}

// Preamble and macros are from Jake Gutierrez's resume template (MIT license),
// which is based on https://github.com/sb2nov/resume.
const PREAMBLE = String.raw`%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{} % clear all header and footer fields
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% Sections formatting
\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\pdfgentounicode=1

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}
`

function texBullets(list: string[], indent: string): string {
  const items = cleanBullets(list)
  // An empty itemize is a LaTeX error, so write nothing when there are no bullets.
  if (items.length === 0) return ''
  return [
    `${indent}\\resumeItemListStart`,
    ...items.map((b) => `${indent}  \\resumeItem{${texEscape(b)}}`),
    `${indent}\\resumeItemListEnd`,
  ].join('\n')
}

export function cvToLatex(d: CvData): string {
  const out: string[] = [PREAMBLE]

  const name = d.basics.name.trim() || 'Your Name'
  const contact = contactItems(d.basics).map(texLink).join(' $|$ ')
  out.push(
    '%----------HEADING----------',
    '\\begin{center}',
    `    \\textbf{\\Huge \\scshape ${texEscape(name)}} \\\\ \\vspace{1pt}`,
    ...(contact ? [`    \\small ${contact}`] : []),
    '\\end{center}',
    '',
  )

  const education = d.education.filter(hasEducation)
  if (education.length) {
    out.push('%-----------EDUCATION-----------', '\\section{Education}', '  \\resumeSubHeadingListStart')
    for (const e of education) {
      out.push(
        '    \\resumeSubheading',
        `      {${texEscape(e.school)}}{${texEscape(e.location)}}`,
        `      {${texEscape(e.degree)}}{${texEscape(dateRange(e.start, e.end, ' -- '))}}`,
      )
    }
    out.push('  \\resumeSubHeadingListEnd', '')
  }

  const experience = d.experience.filter(hasExperience)
  if (experience.length) {
    out.push('%-----------EXPERIENCE-----------', '\\section{Experience}', '  \\resumeSubHeadingListStart', '')
    for (const e of experience) {
      out.push(
        '    \\resumeSubheading',
        `      {${texEscape(e.role)}}{${texEscape(dateRange(e.start, e.end, ' -- '))}}`,
        `      {${texEscape(e.company)}}{${texEscape(e.location)}}`,
      )
      const list = texBullets(e.bullets, '      ')
      if (list) out.push(list)
      out.push('')
    }
    out.push('  \\resumeSubHeadingListEnd', '')
  }

  const projects = d.projects.filter(hasProject)
  if (projects.length) {
    out.push('%-----------PROJECTS-----------', '\\section{Projects}', '    \\resumeSubHeadingListStart')
    for (const p of projects) {
      const stack = p.stack.trim() ? ` $|$ \\emph{${texEscape(p.stack)}}` : ''
      out.push(
        '      \\resumeProjectHeading',
        `          {\\textbf{${texEscape(p.name)}}${stack}}{${texEscape(dateRange(p.start, p.end, ' -- '))}}`,
      )
      const list = texBullets(p.bullets, '          ')
      if (list) out.push(list)
    }
    out.push('    \\resumeSubHeadingListEnd', '')
  }

  const skills = d.skills.filter((s) => s.items.trim())
  if (skills.length) {
    out.push(
      '%-----------TECHNICAL SKILLS-----------',
      '\\section{Technical Skills}',
      ' \\begin{itemize}[leftmargin=0.15in, label={}]',
      '    \\small{\\item{',
    )
    skills.forEach((s, i) => {
      const label = s.label.trim() || 'Skills'
      out.push(`     \\textbf{${texEscape(label)}}{: ${texEscape(s.items)}}${i < skills.length - 1 ? ' \\\\' : ''}`)
    })
    out.push('    }}', ' \\end{itemize}', '')
  }

  out.push('%-------------------------------------------', '\\end{document}', '')
  return out.join('\n')
}

export function cvFileName(d: CvData, extension: string): string {
  const slug = d.basics.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'my'}-cv.${extension}`
}

// ---------- example ----------

// The sample content from the published Jake's Resume template.
export function exampleCv(): CvData {
  const exp = (role: string, company: string, location: string, start: string, end: string, b: string[]): ExperienceItem => ({
    id: newId(), role, company, location, start, end, bullets: b,
  })
  const proj = (name: string, stack: string, start: string, end: string, b: string[]): ProjectItem => ({
    id: newId(), name, stack, start, end, bullets: b,
  })
  const skill = (label: string, items: string): SkillGroup => ({ id: newId(), label, items })
  return {
    basics: { name: 'Jake Ryan', phone: '123-456-7890', email: 'jake@su.edu', linkedin: 'linkedin.com/in/jake', github: 'github.com/jake', website: '' },
    education: [
      { id: newId(), school: 'Southwestern University', location: 'Georgetown, TX', degree: 'Bachelor of Arts in Computer Science, Minor in Business', start: 'Aug. 2018', end: 'May 2021' },
      { id: newId(), school: 'Blinn College', location: 'Bryan, TX', degree: "Associate's in Liberal Arts", start: 'Aug. 2014', end: 'May 2018' },
    ],
    experience: [
      exp('Undergraduate Research Assistant', 'Texas A&M University', 'College Station, TX', 'June 2020', 'Present', [
        'Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems',
        'Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data',
        'Explored ways to visualize GitHub collaboration in a classroom setting',
      ]),
      exp('Information Technology Support Specialist', 'Southwestern University', 'Georgetown, TX', 'Sep. 2018', 'Present', [
        'Communicate with managers to set up campus computers used on campus',
        'Assess and troubleshoot computer problems brought by students, faculty and staff',
        'Maintain upkeep of computers, classroom equipment, and 200 printers across campus',
      ]),
      exp('Artificial Intelligence Research Assistant', 'Southwestern University', 'Georgetown, TX', 'May 2019', 'July 2019', [
        'Explored methods to generate video game dungeons based off of The Legend of Zelda',
        'Developed a game in Java to test the generated dungeons',
        'Contributed 50K+ lines of code to an established codebase via Git',
        'Conducted a human subject study to determine which video game dungeon generation technique is enjoyable',
        'Wrote an 8-page paper and gave multiple presentations on-campus',
        'Presented virtually to the World Conference on Computational Intelligence',
      ]),
    ],
    projects: [
      proj('Gitlytics', 'Python, Flask, React, PostgreSQL, Docker', 'June 2020', 'Present', [
        'Developed a full-stack web application using with Flask serving a REST API with React as the frontend',
        "Implemented GitHub OAuth to get data from user's repositories",
        'Visualized GitHub data to show collaboration',
        'Used Celery and Redis for asynchronous tasks',
      ]),
      proj('Simple Paintball', 'Spigot API, Java, Maven, TravisCI, Git', 'May 2018', 'May 2020', [
        'Developed a Minecraft server plugin to entertain kids during free time for a previous job',
        'Published plugin to websites gaining 2K+ downloads and an average 4.5/5-star review',
        'Implemented continuous delivery using TravisCI to build the plugin upon a new release',
        'Collaborated with Minecraft server administrators to suggest features and get feedback about the plugin',
      ]),
    ],
    skills: [
      skill('Languages', 'Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R'),
      skill('Frameworks', 'React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI'),
      skill('Developer Tools', 'Git, Docker, TravisCI, Google Cloud Platform, VS Code, Visual Studio, PyCharm, IntelliJ, Eclipse'),
      skill('Libraries', 'pandas, NumPy, Matplotlib'),
    ],
  }
}
