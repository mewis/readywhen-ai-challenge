import type { MastraDBMessage } from '@mastra/core/agent'

import { toolCalls, type ToolCall } from './tool-calls'

export function assistantText(messages: MastraDBMessage[]): string {
  return messages
    .filter(message => message.role === 'assistant')
    .map(textOf)
    .map(text => text.trim())
    .filter(text => text.length > 0)
    .join('\n\n')
}

export function userText(input: { inputMessages?: MastraDBMessage[]; rememberedMessages?: MastraDBMessage[] } | undefined): string {
  const seen = new Set<string>()
  const lines: string[] = []
  for (const message of [...(input?.rememberedMessages ?? []), ...(input?.inputMessages ?? [])]) {
    if (message.role !== 'user' || seen.has(message.id)) continue
    seen.add(message.id)
    const text = textOf(message).trim()
    if (text) lines.push(text)
  }
  return lines.join('\n\n')
}

export function sentences(text: string): string[] {
  const cleaned = text.replace(/\bE\./g, 'E')
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)
}

export type Email = { tool: string; body: string; to: string[] }

// Bodies written as Elena. A send_draft reuses the draft already counted.
export function emails(calls: ToolCall[]): Email[] {
  const drafts = calls.filter(call => call.name === 'save_draft')
  const written: Email[] = []
  for (const call of calls) {
    if (call.name === 'save_draft' || call.name === 'send_mail') {
      const body = stringField(call.args, 'body')
      if (body) written.push({ tool: call.name, body, to: addresses(call.args) })
      continue
    }
    if (call.name !== 'send_draft') continue
    const draftId = stringField(call.args, 'draftId')
    const draft = drafts.findLast(candidate => stringField(candidate.result, 'id') === draftId || stringField(candidate.args, 'draftId') === draftId)
    const body = stringField(call.result, 'body') ?? (draft ? stringField(draft.args, 'body') : undefined)
    if (!body || written.some(email => email.body === body)) continue
    const to = addresses(call.result)
    written.push({ tool: call.name, body, to: to.length > 0 ? to : draft ? addresses(draft.args) : [] })
  }
  return written
}

function textOf(message: MastraDBMessage): string {
  const fromParts = partsOf(message).flatMap(part => (part.type === 'text' && 'text' in part && typeof part.text === 'string' ? [part.text] : []))
  if (fromParts.length > 0) return fromParts.join('\n')
  if (typeof message.content === 'string') return message.content
  return typeof message.content?.content === 'string' ? message.content.content : ''
}

function partsOf(message: MastraDBMessage): { type?: string; text?: string }[] {
  const loose = message as MastraDBMessage & { parts?: { type?: string; text?: string }[] }
  if (Array.isArray(loose.parts)) return loose.parts
  const content = message.content as unknown
  if (content && typeof content === 'object' && Array.isArray((content as { parts?: { type?: string; text?: string }[] }).parts)) {
    return (content as { parts: { type?: string; text?: string }[] }).parts
  }
  return []
}

function addresses(value: unknown): string[] {
  const to = record(value)?.to
  if (!Array.isArray(to)) return []
  const found: string[] = []
  for (const item of to) {
    if (typeof item === 'string') found.push(item)
    else if (typeof record(item)?.email === 'string') found.push(record(item)?.email as string)
  }
  return found
}

function stringField(value: unknown, key: string): string | undefined {
  const field = record(value)?.[key]
  return typeof field === 'string' && field.trim() ? field : undefined
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

export function callsFrom(messages: MastraDBMessage[]): ToolCall[] {
  return toolCalls(messages)
}
