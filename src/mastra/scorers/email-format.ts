// Scores an email written as Elena against docs/voice.md.
// No email in the run is not this scorer's case.
import { createScorer, notScorable } from '@mastra/core/evals'

import { callsFrom, emails, sentences, type Email } from './prose'

// Team signs "E." and is Italian. Everyone else signs "Elena".
// Ciao for the Italian addresses in data/owner.md, Hi for the others.
const TEAM = new Set(['giulia@lumelocations.it', 'tommaso@lumelocations.it', 'sara@lumelocations.it', 'luca@lumelocations.it', 'chiara@lumelocations.it'])
const FOREIGN = new Set([
  'jonas.keller@nordlicht-kosmetik.example',
  'anke.vogel@nordlicht-kosmetik.example',
  'oliver.marsh@harlowpine.example',
  'priya.nair@harlowpine.example',
  'camille.roche@maison-delcourt.example',
  'sanne.dewit@vandermeer-outdoor.example',
  'bram.visser@vandermeer-outdoor.example',
])

const CORPORATE = [
  /\bdear\b/i,
  /i hope this (?:email|message) finds you well/i,
  /i am writing to/i,
  /please do not hesitate/i,
  /kind regards/i,
  /best regards/i,
  /yours (?:sincerely|faithfully)/i,
]
const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+\S/m

type Prepared = { hits: string[] }

export const emailFormat = createScorer({
  id: 'email-format',
  description: 'Scores 1 when every email written as Elena matches the voice guide.',
  type: 'agent',
})
  .preprocess(({ run }): Prepared | ReturnType<typeof notScorable> => {
    const written = emails(callsFrom(run.output))
    if (written.length === 0) return notScorable('no email was written')
    return { hits: written.flatMap(hits) }
  })
  .generateScore(({ results }) => (results.preprocessStepResult.hits.length === 0 ? 1 : 0))
  .generateReason(({ results }) => {
    const { hits } = results.preprocessStepResult
    return hits.length === 0 ? 'The email matches the format.' : hits.join(' ')
  })

function hits(email: Email): string[] {
  const found: string[] = []
  const who = email.to[0]?.trim().toLowerCase()
  const greeting = firstLine(email.body)
  const sign = lastLine(email.body)
  const team = who !== undefined && TEAM.has(who)
  const foreign = who !== undefined && FOREIGN.has(who)
  if (!who) {
    if (!/^(?:ciao|hi)\b/i.test(greeting)) found.push(`${email.tool} does not open with Ciao or Hi.`)
  } else if (foreign) {
    if (!/^hi\b/i.test(greeting)) found.push(`${email.tool} does not open with Hi.`)
  } else if (!/^ciao\b/i.test(greeting)) found.push(`${email.tool} does not open with Ciao.`)
  if (team) {
    if (!/(?:^|[\s,])E\.\s*$/.test(sign)) found.push(`${email.tool} does not sign E.`)
  } else if (!/Elena\s*\.?\s*$/.test(sign)) found.push(`${email.tool} does not sign Elena.`)
  const count = sentences(email.body).length
  if (count < 2 || count > 5) found.push(`${email.tool} is ${count} sentences.`)
  if (email.body.includes('!')) found.push(`${email.tool} has an exclamation mark.`)
  if (BULLET.test(email.body)) found.push(`${email.tool} has a bullet list.`)
  if (CORPORATE.some(pattern => pattern.test(email.body))) found.push(`${email.tool} uses corporate phrasing.`)
  return found
}

function firstLine(body: string): string {
  return body.split('\n').map(line => line.trim()).find(line => line.length > 0) ?? ''
}

function lastLine(body: string): string {
  return body.split('\n').map(line => line.trim()).filter(line => line.length > 0).at(-1) ?? ''
}
