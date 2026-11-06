const AGENT_URL = process.env.AGENT_URL ?? 'http://127.0.0.1:4111'

export const maxDuration = 120

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const thread = typeof body?.thread === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(body.thread) ? body.thread : ''
  const mailboxId = typeof body?.mailboxId === 'string' ? body.mailboxId : 'main'
  if (!message) return Response.json({ error: 'Say what you need.' }, { status: 400 })
  if (!thread) return Response.json({ error: 'The conversation could not be started.' }, { status: 400 })
  if (!/^[a-z0-9_-]{1,64}$/.test(mailboxId)) return Response.json({ error: 'That mailbox could not be used.' }, { status: 400 })

  let response: Response
  try {
    response = await fetch(`${AGENT_URL}/api/agents/inbox/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        requestContext: { mailboxId },
        memory: { thread, resource: 'elena' },
      }),
      signal: AbortSignal.timeout(110000),
    })
  } catch {
    return Response.json({ error: 'The assistant could not be reached.' }, { status: 502 })
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = readError(data) || 'The assistant could not answer.'
    return Response.json({ error }, { status: 502 })
  }
  const text = readText(data)
  if (!text) return Response.json({ error: 'The assistant sent an empty reply.' }, { status: 502 })
  const draft = savedDraft(data)
  return Response.json(draft ? { text, draft } : { text })
}

function readText(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const record = data as Record<string, unknown>
  if (typeof record.text === 'string') return record.text
  if (record.response && typeof record.response === 'object' && typeof (record.response as { text?: unknown }).text === 'string') {
    return (record.response as { text: string }).text
  }
  return ''
}

function savedDraft(data: unknown): { id: string; subject: string; body: string } | null {
  const found: { id: string; subject: string; body: string }[] = []
  collect(data, found, 0)
  return found.at(-1) ?? null
}

function collect(value: unknown, found: { id: string; subject: string; body: string }[], depth: number) {
  if (!value || typeof value !== 'object' || depth > 8) return
  if (Array.isArray(value)) {
    for (const item of value) collect(item, found, depth + 1)
    return
  }
  const record = value as Record<string, unknown>
  const payload = record.payload && typeof record.payload === 'object' ? (record.payload as Record<string, unknown>) : null
  const toolName = typeof record.toolName === 'string' ? record.toolName : typeof payload?.toolName === 'string' ? payload.toolName : ''
  const result = 'result' in record ? record.result : payload?.result
  if (toolName === 'save_draft') {
    const draft = asDraft(result)
    if (draft) found.push(draft)
  }
  for (const key of ['toolResults', 'staticToolResults', 'dynamicToolResults', 'steps', 'response']) {
    if (key in record) collect(record[key], found, depth + 1)
  }
}

function asDraft(value: unknown): { id: string; subject: string; body: string } | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || !record.id.startsWith('msg_')) return null
  if (typeof record.body !== 'string') return null
  const labels = Array.isArray(record.labels) ? record.labels : []
  if (labels.length > 0 && !labels.includes('DRAFT')) return null
  return { id: record.id, subject: typeof record.subject === 'string' ? record.subject : '', body: record.body }
}

function readError(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const record = data as Record<string, unknown>
  if (typeof record.error === 'string') return record.error
  if (typeof record.message === 'string') return record.message
  return ''
}
