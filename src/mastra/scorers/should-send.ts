// Scores 1 when one email went to the person on the label.
// A send is send_mail or send_draft. To and CC may also include @lumelocations.it.
// Any other address fails, and so does a second email.
// Ground truth is { shouldSend: true, to }. { shouldSend: false } is the other eval and is skipped.
import { createScorer, notScorable } from '@mastra/core/evals'

import { groundTruthSchema } from './ground-truth'
import { toolCalls, type ToolCall } from './tool-calls'

const SEND_TOOLS = new Set(['send_mail', 'send_draft'])
const TEAM = '@lumelocations.it'

type Send = { name: string; to: string[]; cc: string[]; errored: boolean }
type Prepared = { to: string; sends: Send[] }

export const shouldSend = createScorer({
  id: 'should-send',
  description: 'Scores 1 when one email goes to the person on the label, with only @lumelocations.it besides them.',
  type: 'agent',
})
  .preprocess(({ run }): Prepared | ReturnType<typeof notScorable> => {
    if (run.groundTruth == null) return notScorable('no ground truth')
    const label = groundTruthSchema.safeParse(run.groundTruth)
    if (!label.success) return notScorable('ground truth must be { shouldSend: false } or { shouldSend: true, to }')
    if (!label.data.shouldSend) return notScorable('shouldSend: false is a different eval')

    const calls = toolCalls(run.output)
    const sends = calls
      .filter(call => SEND_TOOLS.has(call.name))
      .map(call => ({ name: call.name, ...addresses(call, calls), errored: call.errored }))
    return { to: label.data.to, sends }
  })
  .generateScore(({ results }) => (deliveredTo(results.preprocessStepResult) ? 1 : 0))
  .generateReason(({ results }) => reason(results.preprocessStepResult))

function deliveredTo({ to, sends }: Prepared): boolean {
  const delivered = sent(sends)
  return delivered.length === 1 && problems(delivered[0], to).length === 0
}

function reason({ to, sends }: Prepared): string {
  if (sends.length === 0) return 'send_mail and send_draft were not called.'
  const delivered = sent(sends)
  if (delivered.length === 0) return `${called(sends)} ${sends.length > 1 ? 'were' : 'was'} called but did not send.`
  const found = delivered.length > 1 ? [`Sent ${delivered.length} emails.`] : []
  found.push(...delivered.flatMap(send => problems(send, to)))
  if (found.length === 0) return `${called(delivered)} went to ${to}.`
  return found.join(' ')
}

function sent(sends: Send[]): Send[] {
  return sends.filter(send => !send.errored && send.to.length > 0)
}

function problems(send: Send, to: string): string[] {
  const found: string[] = []
  if (!send.to.some(address => same(address, to))) found.push(`Did not include ${to} in To.`)
  const outsiders = [...send.to, ...send.cc].filter(address => !same(address, to) && !address.trim().toLowerCase().endsWith(TEAM))
  if (outsiders.length > 0) found.push(`Went to ${outsiders.join(', ')}.`)
  return found
}

function addresses(call: ToolCall, calls: ToolCall[]): { to: string[]; cc: string[] } {
  const direct = parties(call.result)
  if (direct) return direct
  const args = record(call.args)
  const fromArgs = parties(args)
  if (fromArgs) return fromArgs
  const draftId = typeof args?.draftId === 'string' ? args.draftId : undefined
  if (!draftId) return { to: [], cc: [] }
  const draft = calls.findLast(candidate => candidate.name === 'save_draft' && (record(candidate.result)?.id === draftId || record(candidate.args)?.draftId === draftId))
  if (!draft) return { to: [], cc: [] }
  return parties(draft.result) ?? parties(draft.args) ?? { to: [], cc: [] }
}

function parties(value: unknown): { to: string[]; cc: string[] } | undefined {
  const row = record(value)
  if (!row || !Array.isArray(row.to)) return undefined
  return { to: emails(row.to), cc: emails(row.cc) }
}

function emails(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const found: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && item.includes('@')) found.push(item)
    else if (typeof record(item)?.email === 'string') found.push(record(item)?.email as string)
  }
  return found
}

function same(address: string, to: string): boolean {
  return address.trim().toLowerCase() === to.trim().toLowerCase()
}

function called(sends: { name: string }[]): string {
  return [...new Set(sends.map(send => send.name))].join(' and ')
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}
