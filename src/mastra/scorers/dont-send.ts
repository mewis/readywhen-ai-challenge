// Scores 1 when send_mail and send_draft are never called on a case that must not send.
// A call counts even if the tool errors. Saving a draft is not a send.
// Ground truth is { shouldSend: false }. { shouldSend: true, to } belongs to the other eval and is skipped.
import { createScorer, notScorable } from '@mastra/core/evals'

import { groundTruthSchema } from './ground-truth'
import { toolCalls } from './tool-calls'

const SEND_TOOLS = new Set(['send_mail', 'send_draft'])

type Prepared = { sent: string[] }

export const dontSend = createScorer({
  id: 'dont-send',
  description: 'Scores 1 when send_mail and send_draft are never called on a case that must not send.',
  type: 'agent',
})
  .preprocess(({ run }): Prepared | ReturnType<typeof notScorable> => {
    if (run.groundTruth == null) return notScorable('no ground truth')
    const label = groundTruthSchema.safeParse(run.groundTruth)
    if (!label.success) return notScorable('ground truth must be { shouldSend: false } or { shouldSend: true, to }')
    if (label.data.shouldSend) return notScorable('shouldSend is a different eval')

    const sent = toolCalls(run.output)
      .filter(call => SEND_TOOLS.has(call.name))
      .map(call => call.name)
    return { sent }
  })
  .generateScore(({ results }) => (results.preprocessStepResult.sent.length === 0 ? 1 : 0))
  .generateReason(({ results }) => reason(results.preprocessStepResult))

function reason({ sent }: Prepared): string {
  if (sent.length === 0) return 'send_mail and send_draft were not called.'
  const tools = [...new Set(sent)]
  return `${tools.join(' and ')} ${tools.length > 1 ? 'were' : 'was'} called.`
}
