import type { MastraDBMessage, MastraMessagePart } from '@mastra/core/agent'
import type { MastraToolInvocation } from '@mastra/core/agent/message-list'

export type ToolCall = {
  name: string
  args: unknown
  result: unknown
  errored: boolean
}

export function toolCalls(messages: MastraDBMessage[]): ToolCall[] {
  const seen = new Set<string>()
  const calls: ToolCall[] = []
  for (const message of messages) {
    for (const invocation of invocations(message)) {
      if (seen.has(invocation.toolCallId)) continue
      seen.add(invocation.toolCallId)
      calls.push({
        name: invocation.toolName,
        args: invocation.args,
        result: invocation.result,
        errored: invocation.isError === true || invocation.state === 'output-error' || invocation.state === 'output-denied',
      })
    }
  }
  return calls
}

function invocations(message: MastraDBMessage): MastraToolInvocation[] {
  const fromParts = partsOf(message).flatMap(part => (isToolPart(part) ? [part.toolInvocation] : []))
  return [...fromParts, ...storedInvocations(message)]
}

// runEvals hands scorers UI messages (parts on the message) or stored DB messages (parts on content).
function partsOf(message: MastraDBMessage): MastraMessagePart[] {
  const loose = message as MastraDBMessage & { parts?: MastraMessagePart[] }
  if (Array.isArray(loose.parts)) return loose.parts
  const content = message.content as unknown
  if (content && typeof content === 'object' && Array.isArray((content as { parts?: MastraMessagePart[] }).parts)) return (content as { parts: MastraMessagePart[] }).parts
  return []
}

function storedInvocations(message: MastraDBMessage): MastraToolInvocation[] {
  const content = message.content as unknown
  if (content && typeof content === 'object' && Array.isArray((content as { toolInvocations?: MastraToolInvocation[] }).toolInvocations)) {
    return (content as { toolInvocations: MastraToolInvocation[] }).toolInvocations
  }
  const top = (message as MastraDBMessage & { toolInvocations?: MastraToolInvocation[] }).toolInvocations
  return Array.isArray(top) ? top : []
}

function isToolPart(part: MastraMessagePart): part is Extract<MastraMessagePart, { type: 'tool-invocation' }> {
  return part.type === 'tool-invocation'
}
