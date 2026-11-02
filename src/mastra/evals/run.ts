// One command for the eval set. Needs Postgres, the mail API, and ANTHROPIC_API_KEY.
// Each case runs several times so a shift shows up as a rate. Default is 3.
// `npm run eval -- -r=1` runs each case once.
// `npm run eval -- -r=1 -id=hold-domenico -judge` runs one case with the Haiku judges.
// dont-send and should-send are gates: any repeat below 1 fails the case and the command.
import { randomBytes } from 'node:crypto'

import { RequestContext } from '@mastra/core/request-context'
import { runEvals, type MastraScorer } from '@mastra/core/evals'

import { mastra } from '../index'
import { asksOneQuestion } from '../scorers/asks-one-question'
import { chatFormat } from '../scorers/chat-format'
import { dontSend } from '../scorers/dont-send'
import { emailFormat } from '../scorers/email-format'
import { shouldSend } from '../scorers/should-send'
import { cases } from './cases'

const { repeats, caseId, judge } = parseArgs(process.argv)
const selected = caseId ? cases.filter(item => item.id === caseId) : cases
if (caseId && selected.length === 0) throw new Error(`unknown case ${caseId}. ids: ${cases.map(item => item.id).join(', ')}`)
const scorers: MastraScorer[] = [dontSend, shouldSend, chatFormat, emailFormat, asksOneQuestion]
// Haiku judges stay out unless -judge is passed, so a normal pass does not pay for them.
if (judge) {
  const [{ chatJudge }, { emailJudge }] = await Promise.all([import('../scorers/chat-judge'), import('../scorers/email-judge')])
  // Saving a score looks the scorer up on the Mastra instance. Studio never registers these.
  mastra.addScorer(chatJudge)
  mastra.addScorer(emailJudge)
  scorers.push(chatJudge, emailJudge)
}

const gateIds = new Set(['dont-send', 'should-send'])
const gates = scorers.filter(scorer => gateIds.has(scorer.id))
const mailApi = process.env.MAIL_API_URL ?? 'http://localhost:3000'

const rule = '─'.repeat(72)
const green = (text: string) => (process.stdout.isTTY ? `\x1b[32m${text}\x1b[0m` : text)
const red = (text: string) => (process.stdout.isTTY ? `\x1b[31m${text}\x1b[0m` : text)

console.log([`repeats ${repeats}`, caseId, judge ? 'judge' : undefined].filter(Boolean).join('  '))

// List prices, USD per million tokens. Cache write is the 5-minute rate.
const PRICES = {
  agent: { input: 2, cacheRead: 0.1, cacheWrite: 2.5, output: 10 },
  judge: { input: 0.1, cacheRead: 0.01, cacheWrite: 0.125, output: 0.5 },
}
const totals = { agent: emptyTokens(), judge: emptyTokens() }
const started = Date.now()
let gateFailed = false

for (const evalCase of selected) {
  const lines: string[] = []
  const tally = new Map<string, { passed: number; scored: number }>()
  const caseTokens = emptyTokens()

  for (let run = 1; run <= repeats; run++) {
    if (repeats > 1) {
      if (run > 1) lines.push('')
      lines.push(`run ${run}/${repeats}`)
    }
    await runEvals({
      target: mastra.getAgent('inbox'),
      data: [{ input: evalCase.prompt, groundTruth: evalCase.groundTruth, requestContext: await freshMailbox() }],
      gates,
      scorers,
      targetOptions: {
        maxSteps: 25,
        memory: { thread: `eval-${randomBytes(4).toString('hex')}`, resource: 'eval' },
      },
      onItemComplete: ({ targetResult, scorerResults }) => {
        const used = readUsage(targetResult.totalUsage ?? targetResult.usage)
        addTokens(totals.agent, used)
        addTokens(caseTokens, used)
        for (const scorer of scorers) {
          const result = scorerResults[scorer.id]
          record(scorer.id, result, tally, lines)
          addJudgeUsage(result?.judge)
        }
      },
    })
  }

  if (repeats > 1) {
    lines.push('')
    for (const scorer of scorers) {
      const row = tally.get(scorer.id)
      if (!row || row.scored === 0) continue
      const mark = gateIds.has(scorer.id) ? '  gate' : ''
      const summary = `${scorer.id} ${row.passed}/${row.scored}${mark}`
      lines.push(row.passed === row.scored ? green(summary) : red(summary))
    }
  }

  const failed = [...gateIds].some(id => {
    const row = tally.get(id)
    return row !== undefined && row.passed < row.scored
  })
  console.log(`\n${rule}`)
  console.log(`${failed ? red('failed') : green('passed')}  ${evalCase.prompt} (${evalCase.id} - ${evalCase.category})`)
  console.log(evalCase.why)
  console.log('')
  if (lines.length > 0) console.log(lines.join('\n'))
  console.log('')
  console.log(`agent  in ${caseTokens.input}  cache-read ${caseTokens.cacheRead}  cache-write ${caseTokens.cacheWrite}  out ${caseTokens.output}  ${cost(caseTokens, PRICES.agent)}`)
}

const runs = selected.length * repeats
const minutes = (Date.now() - started) / 60000
console.log(`\n${rule}\ncost`)
for (const who of ['agent', 'judge'] as const) {
  const tokens = totals[who]
  console.log(`${who}  in ${tokens.input}  cache-read ${tokens.cacheRead}  cache-write ${tokens.cacheWrite}  out ${tokens.output}  ${cost(tokens, PRICES[who])}`)
}
console.log(`${runs} agent runs in ${minutes.toFixed(1)} min (${((minutes * 60) / runs).toFixed(0)}s per run)`)

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

function addJudgeUsage(judge: Record<string, { executions?: { usage?: Usage }[] } | undefined> | undefined) {
  for (const step of Object.values(judge ?? {})) {
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

function cost(tokens: Tokens, prices: Tokens | null) {
  if (!prices) return 'n/a (set PRICES)'
  const usd = (tokens.input * prices.input + tokens.cacheRead * prices.cacheRead + tokens.cacheWrite * prices.cacheWrite + tokens.output * prices.output) / 1e6
  return `$${usd.toFixed(2)}`
}

function record(id: string, score: { score?: number; reason?: string; notScorable?: { reason?: string }; judge?: Record<string, { executions?: { usage?: Usage }[] }> } | undefined, tally: Map<string, { passed: number; scored: number }>, lines: string[]) {
  const value = typeof score?.score === 'number' ? score.score : undefined
  if (value === undefined) return
  const detail = typeof score?.reason === 'string' ? score.reason : ''
  const scoreText = `${id} ${value}`
  lines.push(`${value === 1 ? green(scoreText) : red(scoreText)}  ${detail}`)
  const row = tally.get(id) ?? { passed: 0, scored: 0 }
  row.scored += 1
  if (value === 1) row.passed += 1
  if (gateIds.has(id) && value < 1) gateFailed = true
  tally.set(id, row)
}

function parseArgs(argv: string[]): { repeats: number; caseId?: string; judge: boolean } {
  const args = argv.slice(2).filter(arg => arg !== '--')
  let repeats = 3
  let caseId: string | undefined
  let judge = false
  for (const arg of args) {
    if (arg === '-judge') {
      judge = true
      continue
    }
    if (arg.startsWith('-r=')) {
      const count = Number(arg.slice(3))
      if (!Number.isInteger(count) || count < 1) throw new Error(`-r must be a positive integer, got ${arg.slice(3) || 'nothing'}`)
      repeats = count
      continue
    }
    if (arg.startsWith('-id=')) {
      const id = arg.slice(4)
      if (!id) throw new Error('-id needs a case id')
      caseId = id
      continue
    }
    throw new Error(`unexpected argument ${arg}. use -r=1 -id=hold-domenico -judge`)
  }
  return { repeats, caseId, judge }
}

async function freshMailbox(): Promise<RequestContext> {
  const res = await fetch(`${mailApi}/api/mailboxes`, { method: 'POST' })
  if (!res.ok) throw new Error(`mail API answered ${res.status}. Start it with npm run dev:web.`)
  const mailbox = (await res.json()) as { id: string }
  const requestContext = new RequestContext()
  requestContext.set('mailboxId', mailbox.id)
  return requestContext
}
