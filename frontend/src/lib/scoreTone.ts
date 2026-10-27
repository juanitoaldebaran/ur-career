export function scoreTone(score: number) {
  if (score >= 80) return { text: 'text-emerald-600', bar: 'bg-emerald-500', label: 'Strong' }
  if (score >= 50) return { text: 'text-amber-600', bar: 'bg-amber-500', label: 'Getting there' }
  return { text: 'text-rose-600', bar: 'bg-rose-500', label: 'Needs work' }
}
