// Messages created by a send get a 12-character hex id (msg_9f3a1b2c4d5e).
// Fixture mail keeps the short ids from data/inbox.json (msg_0001).
const CREATED = /^msg_[0-9a-f]{12}$/

export async function sentThisRun(mailboxId: string): Promise<string[]> {
  const mailApi = process.env.MAIL_API_URL ?? 'http://localhost:3000'
  const ids: string[] = []
  const seen = new Set<string>()
  let pageToken: string | undefined
  for (;;) {
    const params = new URLSearchParams({ label: 'SENT', limit: '100' })
    if (pageToken) params.set('pageToken', pageToken)
    const res = await fetch(`${mailApi}/api/mailboxes/${mailboxId}/messages?${params}`)
    if (!res.ok) throw new Error(`mail API answered ${res.status} while reading SENT`)
    const body = (await res.json()) as { messages?: { id?: string }[]; nextPageToken?: string | null }
    for (const message of body.messages ?? []) {
      if (typeof message.id === 'string' && CREATED.test(message.id)) ids.push(message.id)
    }
    const next = body.nextPageToken ?? undefined
    if (!next || seen.has(next)) return ids
    seen.add(next)
    pageToken = next
  }
}

export function mailboxIdFrom(context: unknown): string {
  if (context && typeof context === 'object' && 'get' in context && typeof context.get === 'function') {
    const id = (context as { get(key: string): unknown }).get('mailboxId')
    if (typeof id === 'string' && id) return id
  }
  throw new Error('no mailbox on this run')
}
