// Scores the reply to Elena against the surface rules in docs/voice.md.
// Headings and bullet lists fail only when the reply is three sentences or fewer.
import { createScorer } from '@mastra/core/evals'

import { assistantText, sentences } from './prose'

const FILLERS = [/\bgreat question\b/i, /\babsolutely\b/i, /\bhappy to help\b/i, /\bi hope this helps\b/i]
const HYPE = /\b(supercharge|seamless(?:ly)?|leverage|empower|unlock|game-changing|revolutionary)\b/i
const SELF = /\b(?:i'm|i am|as) an? (?:ai|model|bot|tool)\b|\blanguage model\b/i
const HEADING = /^#{1,6}\s+\S/m
const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+\S/m

type Prepared = { hits: string[] }

export const chatFormat = createScorer({
  id: 'chat-format',
  description: 'Scores 1 when the reply to Elena avoids the banned chat patterns in the voice guide.',
  type: 'agent',
})
  .preprocess(({ run }): Prepared => ({ hits: hits(assistantText(run.output)) }))
  .generateScore(({ results }) => (results.preprocessStepResult.hits.length === 0 ? 1 : 0))
  .generateReason(({ results }) => {
    const { hits } = results.preprocessStepResult
    return hits.length === 0 ? 'The reply matches the chat format.' : hits.join(' ')
  })

function hits(text: string): string[] {
  if (!text) return ['No reply to Elena.']
  const found: string[] = []
  if (text.includes('!')) found.push('Exclamation mark.')
  if (text.includes('—') || text.includes('--')) found.push('Em dash.')
  if (/\p{Extended_Pictographic}/u.test(text)) found.push('Emoji.')
  if (FILLERS.some(pattern => pattern.test(text))) found.push('Filler opener.')
  if (SELF.test(text)) found.push('Calls itself an AI, a model, a bot or a tool.')
  if (HYPE.test(text)) found.push('Hype word.')
  if (sentences(text).length <= 3 && (HEADING.test(text) || BULLET.test(text))) found.push('Heading or bullet list in a short reply.')
  return found
}
