import type { DreamAnswers } from '../types/dream'

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
