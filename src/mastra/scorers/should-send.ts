// Scores 1 when a send went to the person named on the label.
// A send is send_mail or send_draft. The recipient is the To list on the sent message.
// Ground truth is { shouldSend: true, to }. { shouldSend: false } is the other eval and is skipped.
import { createScorer, notScorable } from '@mastra/core/evals'

import { groundTruthSchema } from './ground-truth'
import { toolCalls, type ToolCall } from './tool-calls'

const SEND_TOOLS = new Set(['send_mail', 'send_draft'])

type Send = { name: string; recipients: string[]; errored: boolean }
type Prepared = { to: string; sends: Send[] }

export const shouldSend = createScorer({
  id: 'should-send',
  description: 'Scores 1 when a send tool delivers to the person on the label.',
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
      .map(call => ({ name: call.name, recipients: recipients(call, calls), errored: call.errored }))
    return { to: label.data.to, sends }
  })
  .generateScore(({ results }) => (deliveredTo(results.preprocessStepResult) ? 1 : 0))
  .generateReason(({ results }) => reason(results.preprocessStepResult))

function deliveredTo({ to, sends }: Prepared): boolean {
  const delivered = sends.filter(send => !send.errored && send.recipients.length > 0)
  return delivered.length > 0 && delivered.every(send => addressedTo(send.recipients, to))
}

function reason({ to, sends }: Prepared): string {
  if (sends.length === 0) return 'send_mail and send_draft were not called.'
  const delivered = sends.filter(send => !send.errored && send.recipients.length > 0)
  if (delivered.length === 0) return `${called(sends)} ${sends.length > 1 ? 'were' : 'was'} called but did not send.`
  const missed = delivered.filter(send => !addressedTo(send.recipients, to))
  if (missed.length === 0) return `${called(delivered)} went to ${to}.`
  return `${called(missed)} went to ${missed.flatMap(send => send.recipients).join(', ')}, not ${to}.`
}

function recipients(call: ToolCall, calls: ToolCall[]): string[] {
  const direct = people(call.result)
  if (direct.length > 0) return direct
  const args = record(call.args)
  const fromArgs = people({ to: args?.to })
  if (fromArgs.length > 0) return fromArgs
  const draftId = typeof args?.draftId === 'string' ? args.draftId : undefined
  if (!draftId) return []
  const draft = calls.findLast(candidate => candidate.name === 'save_draft' && (record(candidate.result)?.id === draftId || record(candidate.args)?.draftId === draftId))
  if (!draft) return []
  const saved = people(draft.result)
  return saved.length > 0 ? saved : people({ to: record(draft.args)?.to })
}

function people(value: unknown): string[] {
  const to = record(value)?.to
  if (!Array.isArray(to)) return []
  const found = []
  for (const item of to) {
    if (typeof item === 'string') found.push(item)
    else if (item && typeof item === 'object') {
      const name = record(item)?.name
      const email = record(item)?.email
      if (typeof name === 'string' && name.trim()) found.push(name)
      if (typeof email === 'string') found.push(email)
    }
  }
  return found
}

function addressedTo(recipients: string[], to: string): boolean {
  const want = to.trim().toLowerCase()
  return recipients.some(recipient => recipient.trim().toLowerCase() === want)
}

function called(sends: { name: string }[]): string {
  return [...new Set(sends.map(send => send.name))].join(' and ')
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}
