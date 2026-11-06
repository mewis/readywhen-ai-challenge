// A run writes results/<timestamp>.json so a later claim can point at a file.
// Comparison uses the latest results file on disk with the same cases and the
// same judge setting, other than the file just written. A higher pass count is
// better. A lower pass count is worse. Rule counts are shown and do not vote.
// A scorer whose scored count changed is shown, and not called better or worse.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export type ScorerTally = { passed: number; scored: number }

export type CaseResult = {
  id: string
  category: string
  scorers: Record<string, ScorerTally>
  rules: Record<string, number>
}

export type TokenCost = {
  input: number
  cacheRead: number
  cacheWrite: number
  output: number
  usd: number
}

export type EvalResult = {
  at: string
  commit: string | null
  dirty: boolean
  promptHash: string
  repeats: number
  judge: boolean
  cases: CaseResult[]
  scorers: Record<string, ScorerTally>
  rules: Record<string, number>
  gatesFailed: string[]
  cost: {
    agent: TokenCost
    judge: TokenCost
    runs: number
    minutes: number
  }
}

export type Movement = 'better' | 'worse' | 'different-size'

export type Change = {
  kind: 'scorer' | 'rule'
  name: string
  before: number
  after: number
  beforeScored?: number
  afterScored?: number
  movement: Movement
}

export type CaseFlip = {
  id: string
  scorer: string
  before: ScorerTally
  after: ScorerTally
  movement: 'better' | 'worse'
}

export type Comparison = {
  file: string
  at: string
  commit: string | null
  promptHash: string
  repeats: number
  changes: Change[]
  caseFlips: CaseFlip[]
  verdict: 'better' | 'worse' | 'mixed' | 'same'
}

export type Identity = {
  commit: string | null
  dirty: boolean
  promptHash: string
}

const GATES = ['not-sent', 'should-send']
const SCORER_ORDER = ['dont-send', 'not-sent', 'should-send', 'chat-format', 'email-format', 'asks-one-question', 'chat-judge', 'email-judge']

export function identity(root = process.cwd()): Identity {
  const prompt = path.join(root, 'src/mastra/agents/inbox.md')
  if (!existsSync(prompt)) throw new Error('src/mastra/agents/inbox.md not found')
  const promptHash = createHash('sha256').update(readFileSync(prompt)).digest('hex')
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
    const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' })
    return { commit, dirty: isDirty(status), promptHash }
  } catch {
    return { commit: null, dirty: false, promptHash }
  }
}

export function writeResult(root: string, result: EvalResult): string {
  const dir = path.join(root, 'results')
  mkdirSync(dir, { recursive: true })
  const stem = result.at.replaceAll(':', '-').replaceAll('.', '-')
  let rel = `results/${stem}.json`
  let n = 2
  while (existsSync(path.join(root, rel))) {
    rel = `results/${stem}-${n}.json`
    n += 1
  }
  writeFileSync(path.join(root, rel), `${JSON.stringify(result, null, 2)}\n`)
  return rel
}

export function previousResult(root: string, current: EvalResult, skip: string): { file: string; result: EvalResult } | null {
  const dir = path.join(root, 'results')
  if (!existsSync(dir)) return null
  const entries: { file: string; result: EvalResult }[] = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    const rel = `results/${name}`
    if (rel === skip) continue
    entries.push({ file: rel, result: readResult(root, rel) })
  }
  return pickPrevious(entries, current)
}

export function pickPrevious(entries: { file: string; result: EvalResult }[], current: EvalResult): { file: string; result: EvalResult } | null {
  const key = caseKey(current)
  const matches = entries.filter(entry => entry.result.judge === current.judge && caseKey(entry.result) === key)
  matches.sort((a, b) => (a.result.at < b.result.at ? 1 : a.result.at > b.result.at ? -1 : 0))
  return matches[0] ?? null
}

export function compare(current: EvalResult, previous: { file: string; result: EvalResult }): Comparison {
  const changes = [...scorerChanges(current, previous.result), ...ruleChanges(current, previous.result)]
  return {
    file: previous.file,
    at: previous.result.at,
    commit: previous.result.commit,
    promptHash: previous.result.promptHash,
    repeats: previous.result.repeats,
    changes,
    caseFlips: gateFlips(previous.result, current),
    verdict: verdictOf(changes),
  }
}

function scorerChanges(current: EvalResult, previous: EvalResult): Change[] {
  const names = [...new Set([...Object.keys(previous.scorers), ...Object.keys(current.scorers)])]
  names.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
  const changes: Change[] = []
  for (const name of names) {
    const before = previous.scorers[name]
    const after = current.scorers[name]
    if (!before || !after || before.scored !== after.scored) {
      changes.push({
        kind: 'scorer',
        name,
        before: before?.passed ?? 0,
        after: after?.passed ?? 0,
        beforeScored: before?.scored,
        afterScored: after?.scored,
        movement: 'different-size',
      })
      continue
    }
    if (before.passed === after.passed) continue
    changes.push({
      kind: 'scorer',
      name,
      before: before.passed,
      after: after.passed,
      beforeScored: before.scored,
      afterScored: after.scored,
      movement: after.passed > before.passed ? 'better' : 'worse',
    })
  }
  return changes
}

function ruleChanges(current: EvalResult, previous: EvalResult): Change[] {
  const names = [...new Set([...Object.keys(previous.rules), ...Object.keys(current.rules)])]
  const changes: Change[] = []
  for (const name of names) {
    const before = previous.rules[name] ?? 0
    const after = current.rules[name] ?? 0
    if (before === after) continue
    changes.push({
      kind: 'rule',
      name,
      before,
      after,
      movement: after < before ? 'better' : 'worse',
    })
  }
  changes.sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before) || a.name.localeCompare(b.name))
  return changes
}

function gateFlips(previous: EvalResult, current: EvalResult): CaseFlip[] {
  const before = new Map(previous.cases.map(item => [item.id, item]))
  const flips: CaseFlip[] = []
  for (const item of current.cases) {
    const prev = before.get(item.id)
    if (!prev) continue
    for (const scorer of GATES) {
      const left = prev.scorers[scorer]
      const right = item.scorers[scorer]
      if (!left || !right || left.scored !== right.scored || left.passed === right.passed) continue
      flips.push({
        id: item.id,
        scorer,
        before: left,
        after: right,
        movement: right.passed > left.passed ? 'better' : 'worse',
      })
    }
  }
  return flips
}

function verdictOf(changes: Change[]): Comparison['verdict'] {
  const votes = changes.filter(change => change.kind === 'scorer' && change.movement !== 'different-size')
  const worse = votes.some(change => change.movement === 'worse')
  const better = votes.some(change => change.movement === 'better')
  if (worse && better) return 'mixed'
  if (worse) return 'worse'
  if (better) return 'better'
  return 'same'
}

function readResult(root: string, rel: string): EvalResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(path.join(root, rel), 'utf8'))
  } catch {
    throw new Error(`${rel} is not valid JSON`)
  }
  if (!isEvalResult(parsed)) throw new Error(`${rel} is not an eval result`)
  return parsed
}

function isEvalResult(value: unknown): value is EvalResult {
  if (!value || typeof value !== 'object') return false
  const row = value as EvalResult
  return typeof row.at === 'string'
    && (row.commit === null || typeof row.commit === 'string')
    && typeof row.dirty === 'boolean'
    && typeof row.promptHash === 'string'
    && typeof row.repeats === 'number'
    && typeof row.judge === 'boolean'
    && Array.isArray(row.cases)
    && row.cases.every(isCase)
    && isTallyMap(row.scorers)
    && isNumberMap(row.rules)
    && Array.isArray(row.gatesFailed)
}

function isCase(value: unknown): value is CaseResult {
  if (!value || typeof value !== 'object') return false
  const row = value as CaseResult
  return typeof row.id === 'string' && typeof row.category === 'string' && isTallyMap(row.scorers) && isNumberMap(row.rules)
}

function isTallyMap(value: unknown): value is Record<string, ScorerTally> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value).every(item => {
    if (!item || typeof item !== 'object') return false
    const row = item as ScorerTally
    return typeof row.passed === 'number' && typeof row.scored === 'number'
  })
}

function isNumberMap(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value).every(item => typeof item === 'number')
}

function caseKey(result: EvalResult): string {
  return result.cases.map(item => item.id).slice().sort().join('\n')
}

function rank(name: string): number {
  const index = SCORER_ORDER.indexOf(name)
  return index === -1 ? SCORER_ORDER.length : index
}

function isDirty(status: string): boolean {
  return status.split('\n').some(line => {
    if (!line.trim()) return false
    const file = line.slice(3).trim().split(' -> ').pop() ?? ''
    return !file.startsWith('results/')
  })
}
