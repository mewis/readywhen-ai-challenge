'use client'

import { useEffect, useRef, type FormEvent } from 'react'

import { SUGGESTIONS } from './suggestions'
import CloseIcon from '@mui/icons-material/Close'

import { Bubble, Close, Composer, EmptyState, Field, Idea, Ideas, Note, Panel, PanelTitle, Send, TitleBar, Transcript, Turn } from './styles'

export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string }

type Props = {
  messages: ChatMessage[]
  draft: string
  pending: boolean
  error: string
  onDraft: (value: string) => void
  onSend: (text: string) => void
  onClose?: () => void
}

export function Chat({ messages, draft, pending, error, onDraft, onSend, onClose }: Props) {
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages, pending])

  function submit(event: FormEvent) {
    event.preventDefault()
    onSend(draft)
  }

  return (
    <Panel>
      <TitleBar>
        <PanelTitle>Agent</PanelTitle>
        {onClose ? (
          <Close type="button" aria-label="Close agent" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </Close>
        ) : null}
      </TitleBar>
      {messages.length === 0 ? (
        <EmptyState>
          <Note>Ask about the inbox. A question is answered here. Mail is only sent when you have said what to send.</Note>
          <Ideas>
            {SUGGESTIONS.map(idea => (
              <Idea key={idea.prompt} type="button" disabled={pending} onClick={() => onSend(idea.prompt)}>
                {idea.label}
              </Idea>
            ))}
          </Ideas>
        </EmptyState>
      ) : (
      <Transcript aria-live="polite">
        {messages.map(message => (
          <Turn key={message.id} mine={message.role === 'user'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
            <Bubble mine={message.role === 'user'}>{message.text}</Bubble>
          </Turn>
        ))}
        {pending ? <Note>Looking through your mail.</Note> : null}
        <div ref={end} />
      </Transcript>
      )}
      {error ? <Note>{error}</Note> : null}
      <Composer onSubmit={submit}>
        <Field
          rows={2}
          value={draft}
          placeholder="Ask about the inbox"
          aria-label="Message"
          disabled={pending}
          onChange={event => onDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSend(draft)
            }
          }}
        />
        <Send type="submit" disabled={pending || draft.trim().length === 0}>
          Send
        </Send>
      </Composer>
    </Panel>
  )
}
