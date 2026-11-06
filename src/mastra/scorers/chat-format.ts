// Scores the reply to Elena against the surface rules in docs/voice.md.
// Headings fail at any length. A bullet list fails only when the reply is three sentences or fewer.
// The baseline "What needs me today?" reply was about 850 words, so a plain briefing still fits under the cap.
import { createScorer } from '@mastra/core/evals'

import { assistantText, isClosingOffer, sentences, withoutQuotes } from './prose'

const MAX_WORDS = 400

const FILLERS = [/\bgreat question\b/i, /\babsolutely\b/i, /\bhappy to help\b/i, /\bi hope this helps\b/i]
const HYPE = /\b(supercharge|seamless(?:ly)?|leverage|empower|unlock|game-changing|revolutionary)\b/i
const SELF = /\b(?:i'm|i am|as) an? (?:ai|model|bot|tool)\b|\blanguage model\b/i
const HEADING = /^#{1,6}\s+\S/m
const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+\S/m
const INTERNAL_ID = /\b(?:msg|thr)_/

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
  if (!text.trim()) return ['No reply to Elena.']
  const own = withoutQuotes(text)
  const found: string[] = []
  if (wordCount(text) > MAX_WORDS) found.push(`Longer than ${MAX_WORDS} words.`)
  if (own.includes('!')) found.push('Exclamation mark.')
  if (own.includes('—')) found.push('Em dash.')
  if (/\p{Extended_Pictographic}/u.test(own)) found.push('Emoji.')
  if (FILLERS.some(pattern => pattern.test(own))) found.push('Filler opener.')
  if (SELF.test(own)) found.push('Calls itself an AI, a model, a bot or a tool.')
  if (HYPE.test(own)) found.push('Hype word.')
  if (HEADING.test(own)) found.push('Heading.')
  if (sentences(text).length <= 3 && BULLET.test(own)) found.push('Bullet list in a short reply.')
  if (isClosingOffer(sentences(text).at(-1) ?? '')) found.push('Closing offer.')
  if (INTERNAL_ID.test(own)) found.push('Internal id.')
  return found
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length
}
