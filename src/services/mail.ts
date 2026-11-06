import type { Mailbox, Message, MessageSummary } from '@/mail/contract'

import type { Attachment, LabelCount } from '@/ui/mail'

function mailboxPath(mailboxId: string, path = ''): string {
  return `/api/mailboxes/${mailboxId}${path}`
}

async function request<T>(path: string, init: RequestInit = {}, fallback = 'The inbox could not be loaded.'): Promise<T> {
  const response = await fetch(path, init)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : fallback)
  return data as T
}

export function getMailbox(mailboxId: string, signal?: AbortSignal): Promise<Mailbox> {
  return request(mailboxPath(mailboxId), { signal })
}

export function getLabels(mailboxId: string, signal?: AbortSignal): Promise<LabelCount[]> {
  return request(mailboxPath(mailboxId, '/labels'), { signal })
}

export function searchMessages(mailboxId: string, folder: string, text: string, signal?: AbortSignal): Promise<{ messages: MessageSummary[] }> {
  const params = new URLSearchParams({ label: folder, limit: '50' })
  if (text.trim()) params.set('text', text.trim())
  return request(mailboxPath(mailboxId, `/messages?${params}`), { signal })
}

export function getMessage(mailboxId: string, id: string, signal?: AbortSignal): Promise<Message> {
  return request(mailboxPath(mailboxId, `/messages/${id}`), { signal }, 'The message could not be opened.')
}

export function getThread(mailboxId: string, threadId: string, signal?: AbortSignal): Promise<Message[]> {
  return request(mailboxPath(mailboxId, `/threads/${threadId}`), { signal }, 'The thread could not be opened.')
}

export function getAttachment(mailboxId: string, messageId: string, attachmentId: string, signal?: AbortSignal): Promise<Attachment> {
  return request(mailboxPath(mailboxId, `/messages/${messageId}/attachments/${attachmentId}`), { signal })
}

export function createMailbox(): Promise<Mailbox> {
  return request('/api/mailboxes', { method: 'POST' }, 'A new mailbox could not be created.')
}

export function sendMail(mailboxId: string, fields: { to: string[]; cc: string[]; subject?: string; body: string; replyToMessageId?: string }): Promise<Message> {
  return request(mailboxPath(mailboxId, '/messages/send'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(fields),
  }, 'The message could not be sent.')
}

export function sendDraft(mailboxId: string, id: string): Promise<Message> {
  return request(mailboxPath(mailboxId, `/drafts/${id}/send`), { method: 'POST' }, 'The draft could not be sent.')
}

export async function changeLabels(mailboxId: string, ids: string[], add: string[], remove: string[]): Promise<void> {
  await request(mailboxPath(mailboxId, '/messages/modify'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids, add, remove }),
  }, 'The message could not be updated.')
}

export async function askAgent(mailboxId: string, thread: string, message: string): Promise<{ text: string; draftId: string | null }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, thread, mailboxId }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'The assistant could not answer.')
  const draftId = data.draft && typeof data.draft.id === 'string' ? data.draft.id : null
  return { text: String(data.text ?? ''), draftId }
}
