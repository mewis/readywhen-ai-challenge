// One command for the eval set. Needs Postgres, the mail API, and ANTHROPIC_API_KEY.
// Each case runs several times so a shift shows up as a rate. Default is 3.
// `npm run eval -- -r=1` runs each case once.
// `npm run eval -- -r=1 -id=q-today,hold-sanne -judge` runs those cases with the Haiku judges.
// not-sent and should-send are gates: any repeat below 1 fails the case and the command.
// dont-send records the agent's choice and does not gate the command.
// Every run writes results/<timestamp>.json. The summary compares with the
// previous file on disk that has the same cases and the same judge setting.
import { randomBytes } from 'node:crypto'

import type { MastraDBMessage } from '@mastra/core/agent'
import { RequestContext } from '@mastra/core/request-context'
import { runEvals, type MastraScorer } from '@mastra/core/evals'

import { mastra } from '../index'
import { asksOneQuestion } from '../scorers/asks-one-question'
import { chatFormat } from '../scorers/chat-format'
import { dontSend } from '../scorers/dont-send'
import { emailFormat } from '../scorers/email-format'
import { notSent } from '../scorers/not-sent'
import { mailboxIdFrom, sentThisRun } from '../scorers/sent-mail'
import { shouldSend } from '../scorers/should-send'
import { toolCalls } from '../scorers/tool-calls'
import { parseArgs } from './args'
import { cases } from './cases'
import { style } from './report'
import { compare, identity, previousResult, writeResult, type CaseResult, type EvalResult, type ScorerTally } from './result'

const { repeats, caseIds, judge } = parseArgs(process.argv)
const known = new Set(cases.map(item => item.id))
const unknown = caseIds.filter(id => !known.has(id))
if (unknown.length > 0) throw new Error(`unknown case ${unknown.join(', ')}. ids: ${cases.map(item => item.id).join(', ')}`)
const selected = caseIds.length > 0 ? cases.filter(item => caseIds.includes(item.id)) : cases
const scorers: MastraScorer[] = [dontSend, notSent, shouldSend, chatFormat, emailFormat, asksOneQuestion]
// Haiku judges stay out unless -judge is passed, so a normal pass does not pay for them.
if (judge) {
  const [{ chatJudge }, { emailJudge }] = await Promise.all([import('../scorers/chat-judge'), import('../scorers/email-judge')])
  // Saving a score looks the scorer up on the Mastra instance. Studio never registers these.
  mastra.addScorer(chatJudge)
  mastra.addScorer(emailJudge)
  scorers.push(chatJudge, emailJudge)
}

const gateIds = new Set(['not-sent', 'should-send'])
const SEND_TOOLS = new Set(['send_mail', 'send_draft'])
const gates = scorers.filter(scorer => gateIds.has(scorer.id))
const mailApi = process.env.MAIL_API_URL ?? 'http://localhost:3000'
const nameWidth = Math.max(12, ...scorers.map(scorer => scorer.id.length))
const { rule, green, red, yellow, cyan, dim, bold, pad, meta, tallyLine, tokenLine, printSummary } = style({ nameWidth, gateIds })

const root = process.cwd()
const info = identity(root)
const startedAt = new Date()

console.log(bold('inbox eval'))
meta('repeats', String(repeats))
meta('cases', caseIds.length > 0 ? `${selected.length}  ${dim(selected.map(item => item.id).join(', '))}` : String(selected.length))
meta('judges', judge ? 'on' : 'off')
meta('commit', `${info.commit ? cyan(info.commit.slice(0, 7)) : yellow('unknown')}${info.dirty ? yellow('  dirty') : ''}`)
meta('prompt', cyan(info.promptHash.slice(0, 12)))

// List prices, USD per million tokens. Cache write is the 5-minute rate.
const PRICES = {
  agent: { input: 2, cacheRead: 0.1, cacheWrite: 2.5, output: 10 },
  judge: { input: 0.1, cacheRead: 0.01, cacheWrite: 0.125, output: 0.5 },
}
const totals = { agent: emptyTokens(), judge: emptyTokens() }
const overall = new Map<string, ScorerTally>()
const rules = new Map<string, number>()
const caseResults: CaseResult[] = []
const gatesFailed: string[] = []
let gateFailed = false

for (const evalCase of selected) {
  const tally = new Map<string, ScorerTally>()
  const caseRules = new Map<string, number>()
  const caseTokens = emptyTokens()

  console.log(`\n${dim(rule)}`)
  console.log(bold(evalCase.prompt))
  console.log(dim(`${evalCase.id}  ·  ${evalCase.category}`))
  console.log(dim(evalCase.why))

  for (let run = 1; run <= repeats; run++) {
    const lines: string[] = []
    if (repeats > 1) console.log(dim(`\n  run ${run}/${repeats}`))
    else console.log()
    await runEvals({
      target: mastra.getAgent('inbox'),
      data: [{ input: evalCase.prompt, groundTruth: evalCase.groundTruth, requestContext: await freshMailbox() }],
      gates,
      scorers,
      targetOptions: {
        maxSteps: 25,
        memory: { thread: `eval-${randomBytes(4).toString('hex')}`, resource: 'eval' },
      },
      onItemComplete: async ({ item, targetResult, scorerResults }) => {
        const used = readUsage(targetResult.totalUsage ?? targetResult.usage)
        addTokens(totals.agent, used)
        addTokens(caseTokens, used)
        for (const scorer of scorers) {
          const result = scorerResults[scorer.id]
          record(scorer.id, result, tally, caseRules, lines)
          addJudgeUsage(result?.judge)
        }
        await checkParser(item.requestContext, targetResult.scoringData?.output)
      },
    })
    if (lines.length > 0) console.log(lines.join('\n'))
  }

  if (repeats > 1) {
    console.log()
    for (const scorer of scorers) {
      const row = tally.get(scorer.id)
      if (!row || row.scored === 0) continue
      console.log(`  ${tallyLine(scorer.id, row)}`)
    }
  }

  const failed = [...gateIds].some(id => {
    const row = tally.get(id)
    return row !== undefined && row.passed < row.scored
  })
  if (failed) gatesFailed.push(evalCase.id)
  console.log(`\n  ${failed ? red(bold('failed')) : green(bold('passed'))}`)
  console.log(`  ${tokenLine('agent', caseTokens, dollars(caseTokens, PRICES.agent))}`)

  for (const [id, row] of tally) {
    const sum = overall.get(id) ?? { passed: 0, scored: 0 }
    sum.passed += row.passed
    sum.scored += row.scored
    overall.set(id, sum)
  }
  for (const [ruleName, count] of caseRules) bump(rules, ruleName, count)
  caseResults.push({
    id: evalCase.id,
    category: evalCase.category,
    scorers: tallyRecord(scorers.map(scorer => scorer.id), tally),
    rules: countRecord(caseRules),
  })
}

const runs = selected.length * repeats
const minutes = (Date.now() - startedAt.getTime()) / 60000
const result: EvalResult = {
  at: startedAt.toISOString(),
  commit: info.commit,
  dirty: info.dirty,
  promptHash: info.promptHash,
  repeats,
  judge,
  cases: caseResults,
  scorers: tallyRecord(scorers.map(scorer => scorer.id), overall),
  rules: countRecord(rules),
  gatesFailed,
  cost: {
    agent: { ...totals.agent, usd: dollars(totals.agent, PRICES.agent) },
    judge: { ...totals.judge, usd: dollars(totals.judge, PRICES.judge) },
    runs,
    minutes: Number(minutes.toFixed(2)),
  },
}
const saved = writeResult(root, result)
const previous = previousResult(root, result, saved)
const comparison = previous ? compare(result, previous) : null

printSummary({
  result,
  comparison,
  saved,
  scorerIds: scorers.map(scorer => scorer.id),
  minutes,
  repeats,
})

if (gateFailed) process.exitCode = 1

type Tokens = { input: number; cacheRead: number; cacheWrite: number; output: number }

type Usage = {
  inputTokens?: number
  outputTokens?: number
  promptTokens?: number
  completionTokens?: number
  cachedInputTokens?: number
  cacheCreationInputTokens?: number
  inputTokenDetails?: { cacheReadTokens?: number; cacheWriteTokens?: number }
}

type ScoreView = {
  score?: number
  reason?: string
  preprocessStepResult?: { hits?: unknown }
  analyzeStepResult?: Record<string, { pass?: boolean }>
  judge?: Record<string, { executions?: { usage?: Usage }[] } | undefined>
}

async function checkParser(context: unknown, output: unknown) {
  const messages: MastraDBMessage[] = Array.isArray(output) ? output : []
  const tried = toolCalls(messages).some(call => SEND_TOOLS.has(call.name))
  const arrived = await sentThisRun(mailboxIdFrom(context))
  if (arrived.length > 0 && !tried) {
    throw new Error(`SENT has ${arrived.join(', ')} but send_mail and send_draft were not called. The tool-call parser is wrong.`)
  }
}

function emptyTokens(): Tokens {
  return { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 }
}

function readUsage(usage: Usage | undefined): Tokens {
  if (!usage) return emptyTokens()
  const cacheRead = usage.inputTokenDetails?.cacheReadTokens ?? usage.cachedInputTokens ?? 0
  const cacheWrite = usage.inputTokenDetails?.cacheWriteTokens ?? usage.cacheCreationInputTokens ?? 0
  return {
    input: (usage.inputTokens ?? usage.promptTokens ?? 0) - cacheRead - cacheWrite,
    cacheRead,
    cacheWrite,
    output: usage.outputTokens ?? usage.completionTokens ?? 0,
  }
}

function addTokens(into: Tokens, extra: Tokens) {
  into.input += extra.input
  into.cacheRead += extra.cacheRead
  into.cacheWrite += extra.cacheWrite
  into.output += extra.output
}

function addJudgeUsage(judgeResult: ScoreView['judge']) {
  for (const step of Object.values(judgeResult ?? {})) {
    for (const execution of step?.executions ?? []) {
      const usage = execution.usage
      if (!usage) continue
      const cacheRead = usage.cachedInputTokens ?? 0
      const cacheWrite = usage.cacheCreationInputTokens ?? 0
      totals.judge.input += (usage.inputTokens ?? 0) - cacheRead - cacheWrite
      totals.judge.cacheRead += cacheRead
      totals.judge.cacheWrite += cacheWrite
      totals.judge.output += usage.outputTokens ?? 0
    }
  }
}

function dollars(tokens: Tokens, prices: Tokens): number {
  const usd = (tokens.input * prices.input + tokens.cacheRead * prices.cacheRead + tokens.cacheWrite * prices.cacheWrite + tokens.output * prices.output) / 1e6
  return Number(usd.toFixed(4))
}

function tallyRecord(ids: string[], tally: Map<string, ScorerTally>): Record<string, ScorerTally> {
  const out: Record<string, ScorerTally> = {}
  for (const id of ids) {
    const row = tally.get(id)
    if (row && row.scored > 0) out[id] = { passed: row.passed, scored: row.scored }
  }
  return out
}

function countRecord(map: Map<string, number>): Record<string, number> {
  return Object.fromEntries([...map.entries()].filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])))
}

function bump(map: Map<string, number>, key: string, by: number) {
  map.set(key, (map.get(key) ?? 0) + by)
}

function record(id: string, score: ScoreView | undefined, tally: Map<string, ScorerTally>, ruleCounts: Map<string, number>, lines: string[]) {
  const value = typeof score?.score === 'number' ? score.score : undefined
  if (value === undefined || !score) return
  const detail = typeof score.reason === 'string' ? score.reason : ''
  const mark = value === 1 ? green(String(value)) : red(String(value))
  lines.push(`  ${pad(id, nameWidth)}  ${mark}  ${value === 1 ? dim(detail) : detail}`)
  const row = tally.get(id) ?? { passed: 0, scored: 0 }
  row.scored += 1
  if (value === 1) row.passed += 1
  else for (const ruleName of failedRules(score)) bump(ruleCounts, ruleName, 1)
  if (gateIds.has(id) && value < 1) gateFailed = true
  tally.set(id, row)
}

function failedRules(score: ScoreView): string[] {
  const hits = score.preprocessStepResult?.hits
  if (Array.isArray(hits)) {
    const names = hits.filter((hit): hit is string => typeof hit === 'string' && hit.length > 0)
    if (names.length > 0) return names
  }
  const analysis = score.analyzeStepResult
  if (!analysis) return []
  return Object.entries(analysis).flatMap(([name, item]) => (item?.pass === false ? [name] : []))
}

async function freshMailbox(): Promise<RequestContext> {
  const res = await fetch(`${mailApi}/api/mailboxes`, { method: 'POST' })
  if (!res.ok) throw new Error(`mail API answered ${res.status}. Start it with npm run dev:web.`)
  const mailbox = (await res.json()) as { id: string }
  const requestContext = new RequestContext()
  requestContext.set('mailboxId', mailbox.id)
  return requestContext
}
