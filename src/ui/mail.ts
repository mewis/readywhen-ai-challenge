import type { Address, AttachmentMeta, Mailbox, Message, MessageSummary } from '@/mail/contract'

export type { Address, Mailbox, Message, MessageSummary }

export type Attachment = AttachmentMeta & { content?: string }

export type LabelCount = { name: string; total: number; unread: number }

export function hasLabel(labels: readonly string[], label: string): boolean {
  return labels.some(item => item === label)
}

export type ReplyKind = 'reply' | 'reply-all' | 'forward'

export type ReplyDraft = {
  kind: ReplyKind
  to: string
  cc: string
  subject: string
  body: string
  replyToMessageId?: string
}

export function replyDraft(message: Message, ownerEmail: string, kind: ReplyKind): ReplyDraft {
  if (kind === 'forward') {
    const subject = message.subject || '(no subject)'
    return {
      kind,
      to: '',
      cc: '',
      subject: /^fwd:/i.test(subject) ? subject : `Fwd: ${subject}`,
      body: ['', '---------- Forwarded message ----------', `From: ${person(message.from)}`, `Date: ${formatWhen(message.date, true)}`, `Subject: ${subject}`, `To: ${message.to.map(person).join(', ') || 'undisclosed'}`, '', message.body].join('\n'),
    }
  }

  const mine = message.from.email.toLowerCase() === ownerEmail.toLowerCase()
  const to = mine ? message.to.map(address => address.email) : [message.from.email]
  const taken = new Set(to.map(email => email.toLowerCase()))
  const cc = kind === 'reply-all'
    ? unique(message.to.concat(message.cc).map(address => address.email).filter(email => email.toLowerCase() !== ownerEmail.toLowerCase() && !taken.has(email.toLowerCase())))
    : []

  return { kind, to: to.join(', '), cc: cc.join(', '), subject: message.subject, body: '', replyToMessageId: message.id }
}

export function parseRecipients(value: string): string[] {
  return value.split(/[,;]/).map(part => part.trim()).filter(Boolean)
}

function unique(emails: string[]): string[] {
  const seen = new Set<string>()
  return emails.filter(email => {
    const key = email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function person(address: Address): string {
  return address.name?.trim() || address.email
}

export function replyRequest(id: string, name: string): { shown: string; text: string } {
  return {
    shown: `Write my response to ${name}.`,
    text: `Write a reply to message ${id}. Save it as a draft in that thread. Do not send.`,
  }
}

export function initial(name: string): string {
  const letter = name.trim().charAt(0)
  return letter ? letter.toUpperCase() : '?'
}

export function formatWhen(iso: string, withTime = false): string {
  const zone = { timeZone: 'Europe/Rome' }
  if (!withTime) return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...zone })
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', ...zone })
}
