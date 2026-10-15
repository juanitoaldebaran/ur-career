/**
 * Maps a free-text "target job" to one of the roadmaps.
 *
 * Users type their own words ("Back-end dev", "ML engineer"), so we match on
 * keywords instead of requiring an exact title. The longest matching keyword
 * wins, which is why "full stack" beats "backend" for "Full Stack Backend Dev".
 */
export interface RoadmapTarget {
  slug: string
  title: string
  keywords: string[]
}

export const ROADMAP_TARGETS: RoadmapTarget[] = [
  { slug: 'backend-software-engineer', title: 'Backend Software Engineer', keywords: ['backend', 'back end', 'server side', 'api developer', 'golang', 'go developer'] },
  { slug: 'frontend-software-engineer', title: 'Frontend Software Engineer', keywords: ['frontend', 'front end', 'ui developer', 'react developer', 'web developer'] },
  { slug: 'full-stack-engineer', title: 'Full Stack Engineer', keywords: ['full stack', 'fullstack'] },
  { slug: 'mobile-engineer', title: 'Mobile Engineer', keywords: ['mobile', 'ios', 'android', 'flutter', 'react native', 'app developer'] },
  { slug: 'devops-engineer', title: 'DevOps Engineer', keywords: ['devops', 'sre', 'site reliability', 'platform engineer', 'infrastructure'] },
  { slug: 'cloud-computing', title: 'Cloud Computing', keywords: ['cloud', 'aws', 'azure', 'gcp', 'solutions architect'] },
  { slug: 'data-scientist', title: 'Data Scientist', keywords: ['data scien', 'data analyst', 'data analytics', 'analytics', 'machine learning', 'ml engineer', 'statistician'] },
  { slug: 'ai-engineer', title: 'AI Engineer', keywords: ['ai engineer', 'artificial intelligence', 'llm', 'prompt engineer', 'ai developer', 'generative ai'] },
]

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `
}

export function findTargetRoadmap(targetJob: string | undefined | null): RoadmapTarget | null {
  if (!targetJob?.trim()) return null
  const text = normalize(targetJob)

  let best: RoadmapTarget | null = null
  let bestScore = 0
  for (const target of ROADMAP_TARGETS) {
    const phrases = [target.title, ...target.keywords]
    for (const phrase of phrases) {
      const needle = normalize(phrase).trimEnd() // allow prefixes like "data scien"
      if (text.includes(needle) && needle.length > bestScore) {
        best = target
        bestScore = needle.length
      }
    }
  }
  return best
}
