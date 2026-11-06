'use client'

import { useEffect, useRef, useState } from 'react'

import type { ChatMessage } from '@/components/chat/Chat'
import { useMailboxId } from '@/hooks/useMailboxId'
import { askAgent } from '@/services/mail'

export function useChat(onReplied: (draftId: string | null) => void) {
  const mailboxId = useMailboxId()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const thread = useRef(crypto.randomUUID())
  const activeMailbox = useRef(mailboxId)
  activeMailbox.current = mailboxId

  useEffect(() => {
    thread.current = crypto.randomUUID()
    setMessages([])
    setDraft('')
    setError('')
  }, [mailboxId])

  async function send(text: string, shown = text) {
    const message = text.trim()
    const forMailbox = mailboxId
    if (!message || pending) return
    setDraft('')
    setError('')
    setMessages(current => [...current, { id: crypto.randomUUID(), role: 'user', text: shown.trim() || message }])
    setPending(true)
    try {
      const reply = await askAgent(forMailbox, thread.current, message)
      if (activeMailbox.current !== forMailbox) return
      setMessages(current => [...current, { id: crypto.randomUUID(), role: 'assistant', text: reply.text }])
      onReplied(reply.draftId)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The assistant could not answer.')
    } finally {
      setPending(false)
    }
  }

  return { messages, draft, pending, error, onDraft: setDraft, onSend: send }
}
