// Scores 1 when this run added nothing to SENT on a case that must not send.
// The mailbox is the outcome. dont-send is whether the agent called the tool.
// Ground truth is { shouldSend: false }. { shouldSend: true, to } belongs to the other eval and is skipped.
import { createScorer, notScorable } from '@mastra/core/evals'

import { groundTruthSchema } from './ground-truth'
import { mailboxIdFrom, sentThisRun } from './sent-mail'

type Prepared = { ids: string[] }

export const notSent = createScorer({
  id: 'not-sent',
  description: 'Scores 1 when a case that must not send added no message to SENT.',
  type: 'agent',
})
  .preprocess(async ({ run }): Promise<Prepared | ReturnType<typeof notScorable>> => {
    if (run.groundTruth == null) return notScorable('no ground truth')
    const label = groundTruthSchema.safeParse(run.groundTruth)
    if (!label.success) return notScorable('ground truth must be { shouldSend: false } or { shouldSend: true, to }')
    if (label.data.shouldSend) return notScorable('shouldSend is a different eval')
    return { ids: await sentThisRun(mailboxIdFrom(run.requestContext)) }
  })
  .generateScore(({ results }) => (results.preprocessStepResult.ids.length === 0 ? 1 : 0))
  .generateReason(({ results }) => reason(results.preprocessStepResult))

function reason({ ids }: Prepared): string {
  if (ids.length === 0) return 'No new message in SENT.'
  return `SENT has ${ids.join(', ')}.`
}
