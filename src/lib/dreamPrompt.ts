import type { DestinationRec, DreamAnswers } from '../types/dream'

/** Turn the questionnaire answers into a readable prompt for the model. */
export function buildDreamPrompt(a: DreamAnswers): string {
  const lines = [
    `When: ${a.when}`,
    `Budget: ${a.budget}`,
    `Travelling as: ${a.company}`,
    `Trip style: ${a.style}`,
    `Kids in the group: ${a.kids ? 'yes' : 'no'}`,
    `Elderly in the group: ${a.elderly ? 'yes' : 'no'}`,
    `Visa preference: ${a.visa}`,
    `Food preference: ${a.food}`,
    `Preferred temperature: ${a.temperature}`,
    `Preferred setting: ${a.terrain}`,
  ]
  if (a.homeCountry.trim()) lines.push(`Travelling from: ${a.homeCountry.trim()}`)
  if (a.notes.trim()) lines.push(`Extra notes: ${a.notes.trim()}`)
  return lines.join('\n')
}

/** A one-line human summary of the answers, for headers and saved history. */
export function summarizeDreamAnswers(a: DreamAnswers): string {
  const parts = [a.company, a.style, `${a.terrain} lover`, `${a.budget} budget`, a.when]
  return parts.filter(Boolean).join(' · ')
}

/**
 * Build a rich itinerary prompt when the user picks a suggested destination,
 * folding in the answers they gave while dreaming so the plan stays personal.
 */
export function destinationToPrompt(dest: DestinationRec, a: DreamAnswers | null): string {
  const days = dest.suggestedDays || 5
  const where = dest.country && dest.country !== dest.name ? `${dest.name}, ${dest.country}` : dest.name
  const parts = [`${days} days in ${where}`]

  if (a) {
    parts.push(`for a ${a.company.toLowerCase()} trip`)
    parts.push(`${a.style.toLowerCase()} pace`)
    parts.push(`${a.budget.toLowerCase()} budget`)
    if (a.food && a.food !== 'No preference') parts.push(`${a.food.toLowerCase()} food`)
    if (a.terrain && a.terrain !== 'Mix') parts.push(a.terrain.toLowerCase())
    if (a.kids) parts.push('travelling with kids')
    if (a.elderly) parts.push('travelling with elderly')
  }
  if (dest.bestSeason) parts.push(`around ${dest.bestSeason}`)
  return parts.join(', ')
}
