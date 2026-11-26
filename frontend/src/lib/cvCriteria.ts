// Mirrors maxScores in backend/internal/cvreview/grader.go.
export const CRITERIA: Record<string, { label: string; max: number; checks: string }> = {
  impact: { label: 'Impact', max: 35, checks: 'What your work changed, not only what you were assigned.' },
  relevance: { label: 'Relevance', max: 35, checks: 'How closely your experience matches the target role.' },
  clarity: { label: 'Clarity', max: 20, checks: 'Whether each line is easy to understand on a first read.' },
  structure: { label: 'Structure', max: 10, checks: 'Whether a recruiter can find things quickly.' },
}
