// `npm run eval -- -r=1 -id=q-today,hold-sanne` runs those cases once.
export function parseArgs(argv: string[]): { repeats: number; caseIds: string[]; judge: boolean } {
  const args = argv.slice(2).filter(arg => arg !== '--')
  let repeats = 3
  let caseIds: string[] = []
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
      caseIds = caseList(arg.slice(4))
      continue
    }
    throw new Error(`unexpected argument ${arg}. use -r=1 -id=hold-domenico -judge`)
  }
  return { repeats, caseIds, judge }
}

function caseList(raw: string): string[] {
  if (!raw.trim()) throw new Error('-id needs a case id')
  const ids = raw.split(',').map(id => id.trim())
  if (ids.some(id => id.length === 0)) throw new Error('-id has an empty case id')
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`duplicate case ${id}`)
    seen.add(id)
  }
  return ids
}
