// Scores 1 on an unclear case when nothing was sent and Elena was asked one real question.
// A closing offer does not count as the question. Other cases are skipped.
import { createScorer, notScorable } from '@mastra/core/evals'

import { groundTruthSchema } from './ground-truth'
import { assistantText, isClosingOffer, sentences } from './prose'
import { toolCalls } from './tool-calls'

const SEND_TOOLS = new Set(['send_mail', 'send_draft'])

type Prepared = { hits: string[] }

export const asksOneQuestion = createScorer({
  id: 'asks-one-question',
  description: 'Scores 1 when an unclear case sends nothing and asks one question that is not a closing offer.',
  type: 'agent',
})
  .preprocess(({ run }): Prepared | ReturnType<typeof notScorable> => {
    if (run.groundTruth == null) return notScorable('no ground truth')
    const label = groundTruthSchema.safeParse(run.groundTruth)
    if (!label.success) return notScorable('ground truth must be { shouldSend: false } or { shouldSend: true, to }')
    if (label.data.shouldSend) return notScorable('shouldSend is a different eval')
    if (!label.data.unclear) return notScorable('not an unclear case')

    const sent = toolCalls(run.output).some(call => SEND_TOOLS.has(call.name))
    let questions = 0
    let offers = 0
    for (const sentence of sentences(assistantText(run.output))) {
      if (!sentence.includes('?')) continue
      if (isClosingOffer(sentence)) offers += 1
      else questions += 1
    }
    return { hits: hits(sent, questions, offers) }
  })
  .generateScore(({ results }) => (results.preprocessStepResult.hits.length === 0 ? 1 : 0))
  .generateReason(({ results }) => {
    const { hits } = results.preprocessStepResult
    return hits.length === 0 ? 'Asked one question.' : hits.join(' ')
  })

function hits(sent: boolean, questions: number, offers: number): string[] {
  if (sent) return ['Sent an email instead of asking.']
  if (questions === 1) return []
  if (questions === 0 && offers > 0) return ['The only question was a closing offer.']
  if (questions === 0) return ['Asked nothing.']
  return [`Asked ${questions} questions.`]
}
