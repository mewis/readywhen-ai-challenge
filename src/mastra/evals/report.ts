// Terminal layout for one eval run. Colour is skipped when stdout is not a terminal.
import type { Change, Comparison, EvalResult, ScorerTally } from './result'

type Tokens = { input: number; cacheRead: number; cacheWrite: number; output: number }

export function style(options: { nameWidth: number; gateIds: Set<string> }) {
  const { nameWidth, gateIds } = options
  const width = Math.min(88, Math.max(72, process.stdout.columns ?? 72))
  const rule = '─'.repeat(width)
  const tty = Boolean(process.stdout.isTTY)
  const paint = (code: string, text: string) => (tty ? `\x1b[${code}m${text}\x1b[0m` : text)
  const green = (text: string) => paint('32', text)
  const red = (text: string) => paint('31', text)
  const yellow = (text: string) => paint('33', text)
  const cyan = (text: string) => paint('36', text)
  const dim = (text: string) => paint('2', text)
  const bold = (text: string) => paint('1', text)

  function pad(text: string, size: number): string {
    return text.length >= size ? text : text + ' '.repeat(size - text.length)
  }

  function meta(label: string, value: string) {
    console.log(`  ${dim(pad(label, 8))} ${value}`)
  }

  function labelled(label: string, value: string) {
    console.log(`${bold(pad(label, 9))} ${value}`)
  }

  function tallyLine(id: string, row: ScorerTally): string {
    const text = `${pad(id, nameWidth)}  ${`${row.passed}/${row.scored}`.padStart(7)}${gateIds.has(id) ? '  gate' : ''}`
    if (row.passed === row.scored) return green(text)
    if (gateIds.has(id) || row.passed === 0) return red(text)
    return yellow(text)
  }

  function money(usd: number): string {
    if (usd === 0) return '$0.00'
    return usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`
  }

  function tokenLine(label: string, tokens: Tokens, usd: number): string {
    return `${pad(label, 6)}  ${dim('in')} ${tokens.input}  ${dim('cache-read')} ${tokens.cacheRead}  ${dim('cache-write')} ${tokens.cacheWrite}  ${dim('out')} ${tokens.output}  ${bold(money(usd))}`
  }

  function printSummary(input: { result: EvalResult; comparison: Comparison | null; saved: string; scorerIds: string[]; minutes: number; repeats: number }) {
    const { result, comparison, saved, scorerIds, minutes, repeats } = input
    console.log(`\n${dim(rule)}`)
    console.log(bold('totals'))
    console.log()
    console.log(`  ${dim(pad('scorer', nameWidth))}  ${dim('passed'.padStart(7))}`)
    for (const id of scorerIds) {
      const row = result.scorers[id]
      if (!row || row.scored === 0) continue
      console.log(`  ${tallyLine(id, row)}`)
    }

    console.log(`\n${bold('rules')}`)
    console.log()
    const ruleEntries = Object.entries(result.rules).filter(([, count]) => count > 0)
    if (ruleEntries.length === 0) console.log(`  ${green('none failed')}`)
    else {
      const countWidth = String(Math.max(...ruleEntries.map(([, count]) => count))).length
      for (const [name, count] of ruleEntries) console.log(`  ${red(String(count).padStart(countWidth))}  ${name}`)
    }

    console.log(`\n${bold('cost')}`)
    console.log()
    console.log(`  ${tokenLine('agent', result.cost.agent, result.cost.agent.usd)}`)
    console.log(`  ${tokenLine('judge', result.cost.judge, result.cost.judge.usd)}`)
    console.log(dim(`  ${result.cost.runs} runs in ${minutes.toFixed(1)} min, ${((minutes * 60) / result.cost.runs).toFixed(0)}s each`))

    console.log()
    labelled('saved', cyan(saved))
    printComparison(comparison, result.promptHash, repeats)
    labelled('gates', result.gatesFailed.length === 0 ? green(bold('passed')) : `${red(bold('failed'))}  ${dim(result.gatesFailed.join(', '))}`)
  }

  function printComparison(comparison: Comparison | null, promptHash: string, repeats: number) {
    console.log()
    if (!comparison) {
      labelled('result', bold('no earlier run to compare'))
      console.log(dim('  the next run of these cases will compare against the file just written'))
      console.log()
      return
    }
    labelled('compared', cyan(comparison.file))
    const previousCommit = comparison.commit ? comparison.commit.slice(0, 7) : 'unknown'
    console.log(dim(`  ${previousCommit}  ${comparison.repeats} repeats  prompt ${comparison.promptHash.slice(0, 12)}`))
    if (comparison.promptHash === promptHash) console.log(dim('  same prompt'))
    else console.log(yellow('  prompt differs from that run'))
    if (comparison.repeats !== repeats) console.log(yellow(`  repeats differ (${comparison.repeats} there, ${repeats} here)`))
    console.log()
    if (comparison.changes.length === 0 && comparison.caseFlips.length === 0) console.log(dim('  no change in the totals'))
    const changeWidth = Math.max(nameWidth, ...comparison.changes.map(change => change.name.length), 8)
    let previousKind = ''
    for (const change of comparison.changes) {
      if (previousKind && previousKind !== change.kind) console.log()
      previousKind = change.kind
      console.log(changeLine(change, changeWidth))
    }
    if (comparison.caseFlips.length > 0) {
      console.log()
      console.log(dim('  cases'))
      for (const flip of comparison.caseFlips) {
        const text = `  ${pad(flip.id, 22)}  ${pad(flip.scorer, nameWidth)}  ${flip.before.passed}/${flip.before.scored} → ${flip.after.passed}/${flip.after.scored}  ${flip.movement}`
        console.log(flip.movement === 'worse' ? red(text) : green(text))
      }
    }
    console.log()
    labelled('result', verdictLine(comparison))
    console.log()
  }

  function changeLine(change: Change, changeWidth: number): string {
    const delta = change.after - change.before
    const signed = (delta > 0 ? `+${delta}` : String(delta)).padStart(4)
    const counts = change.kind === 'scorer' ? `${fraction(change.before, change.beforeScored)} → ${fraction(change.after, change.afterScored)}` : `${change.before} → ${change.after}`
    const text = `  ${pad(change.name, changeWidth)}  ${pad(counts, 18)}  ${signed}`
    if (change.kind === 'rule') return dim(`${text}  rule`)
    const label = change.movement === 'different-size' ? 'different size' : change.movement
    const labelled = `${text}  ${label}`
    if (change.movement === 'different-size') return yellow(labelled)
    return change.movement === 'worse' ? red(labelled) : green(labelled)
  }

  function fraction(passed: number, scored: number | undefined): string {
    return scored === undefined ? 'n/a' : `${passed}/${scored}`
  }

  function verdictLine(comparison: Comparison): string {
    if (comparison.verdict === 'better') return green(bold('better'))
    if (comparison.verdict === 'worse') return red(bold('worse'))
    if (comparison.verdict === 'mixed') return yellow(bold('mixed'))
    return bold('no change')
  }

  return { rule, green, red, yellow, cyan, dim, bold, pad, meta, labelled, tallyLine, tokenLine, printSummary }
}
