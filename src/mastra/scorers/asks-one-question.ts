// Scores 1 when the reply to Elena asks one thing, or nothing.
// A question is a question mark in the chat. Email bodies are not counted.
import { createScorer } from '@mastra/core/evals'

import { assistantText } from './prose'

type Prepared = { questions: number }

export const asksOneQuestion = createScorer({
  id: 'asks-one-question',
  description: 'Scores 1 when the reply to Elena contains at most one question mark.',
  type: 'agent',
})
  .preprocess(({ run }): Prepared => ({ questions: (assistantText(run.output).match(/\?/g) ?? []).length }))
  .generateScore(({ results }) => (results.preprocessStepResult.questions <= 1 ? 1 : 0))
  .generateReason(({ results }) => {
    const { questions } = results.preprocessStepResult
    if (questions === 0) return 'Asked nothing.'
    if (questions === 1) return 'Asked one question.'
    return `Asked ${questions} questions.`
  })
