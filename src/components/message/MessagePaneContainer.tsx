'use client'

import { useEffect, useRef, useState } from 'react'

import { useMailboxId } from '@/hooks/useMailboxId'
import { useMessage } from '@/hooks/useMessage'
import { useThread } from '@/hooks/useThread'
import { changeLabels, sendDraft, sendMail } from '@/services/mail'
import { hasLabel, person } from '@/ui/mail'

import { MessagePane } from './MessagePane'

type Props = {
  id: string | null
  tick: number
  ownerEmail: string
  replying: boolean
  onReply: (id: string, name: string) => void
  onSent: (id: string) => void
  onChanged: () => void
}

export function MessagePaneContainer({ id, tick, ownerEmail, replying, onReply, onSent, onChanged }: Props) {
  const mailboxId = useMailboxId()
  const { message, status, error } = useMessage(id, tick)
  const thread = useThread(message?.threadId ?? null, tick)
  const seen = useRef<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  useEffect(() => {
    setSendError('')
  }, [id])

  useEffect(() => {
    seen.current = null
  }, [mailboxId])

  useEffect(() => {
    if (!id || !message || message.id !== id || seen.current === message.id) return
    if (!hasLabel(message.labels, 'UNREAD')) return
    seen.current = message.id
    changeLabels(mailboxId, [message.id], [], ['UNREAD']).then(onChanged).catch(() => {})
  }, [mailboxId, id, message, onChanged])

  function send() {
    if (!message || sending) return
    setSending(true)
    setSendError('')
    sendDraft(mailboxId, message.id)
      .then(() => onSent(message.id))
      .catch(error => setSendError(error instanceof Error ? error.message : 'The draft could not be sent.'))
      .finally(() => setSending(false))
  }

  function sendReply(fields: { to: string[]; cc: string[]; subject?: string; body: string; replyToMessageId?: string }) {
    if (sending) return
    setSending(true)
    setSendError('')
    sendMail(mailboxId, fields)
      .then(sentMessage => onSent(sentMessage.id))
      .catch(error => setSendError(error instanceof Error ? error.message : 'The message could not be sent.'))
      .finally(() => setSending(false))
  }

  function star() {
    if (!message) return
    const starred = hasLabel(message.labels, 'STARRED')
    changeLabels(mailboxId, [message.id], starred ? [] : ['STARRED'], starred ? ['STARRED'] : []).then(onChanged).catch(() => {})
  }

  return (
    <MessagePane
      mailboxId={mailboxId}
      message={message}
      thread={thread.id === message?.threadId ? thread.messages : []}
      ownerEmail={ownerEmail}
      status={status}
      error={error}
      replying={replying}
      sending={sending}
      sendError={sendError}
      onStar={star}
      onSend={send}
      onSendReply={sendReply}
      onReply={() => {
        if (message) onReply(message.id, person(message.from))
      }}
    />
  )
}
