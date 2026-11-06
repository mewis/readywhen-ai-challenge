'use client'

import { useState } from 'react'

import { parseRecipients, replyDraft, type Message, type ReplyKind } from '@/ui/mail'

import { Composer, ComposerActions, ComposerBody, ComposerField, ComposerInput, ComposerLabel, QuietButton, SendButton, SendError } from './styles'

type Fields = { to: string[]; cc: string[]; subject?: string; body: string; replyToMessageId?: string }

type Props = {
  message: Message
  ownerEmail: string
  kind: ReplyKind
  sending: boolean
  error: string
  onSend: (fields: Fields) => void
  onDiscard: () => void
}

export function ReplyForm({ message, ownerEmail, kind, sending, error, onSend, onDiscard }: Props) {
  const draft = replyDraft(message, ownerEmail, kind)
  const [to, setTo] = useState(draft.to)
  const [cc, setCc] = useState(draft.cc)
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)
  const forward = kind === 'forward'
  const recipients = parseRecipients(to)
  const canSend = !sending && body.trim().length > 0 && recipients.length > 0

  return (
    <Composer
      onSubmit={event => {
        event.preventDefault()
        if (!canSend) return
        onSend({
          to: recipients,
          cc: parseRecipients(cc),
          subject: forward ? subject : undefined,
          body,
          replyToMessageId: draft.replyToMessageId,
        })
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape') return
        event.stopPropagation()
        onDiscard()
      }}
    >
      <ComposerField>
        <ComposerLabel>To</ComposerLabel>
        <ComposerInput value={to} onChange={event => setTo(event.target.value)} autoFocus={forward} />
      </ComposerField>
      <ComposerField>
        <ComposerLabel>Cc</ComposerLabel>
        <ComposerInput value={cc} onChange={event => setCc(event.target.value)} />
      </ComposerField>
      {forward ? (
        <ComposerField>
          <ComposerLabel>Subject</ComposerLabel>
          <ComposerInput value={subject} onChange={event => setSubject(event.target.value)} />
        </ComposerField>
      ) : null}
      <ComposerBody
        aria-label={forward ? 'Message' : 'Reply'}
        value={body}
        placeholder={forward ? 'Add a note' : 'Write your reply'}
        onChange={event => setBody(event.target.value)}
        autoFocus={!forward}
      />
      {error ? <SendError>{error}</SendError> : null}
      <ComposerActions>
        <SendButton type="submit" disabled={!canSend}>
          {sending ? 'Sending…' : 'Send'}
        </SendButton>
        <QuietButton type="button" onClick={onDiscard}>
          Discard
        </QuietButton>
      </ComposerActions>
    </Composer>
  )
}
