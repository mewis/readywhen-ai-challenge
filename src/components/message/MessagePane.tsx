'use client'

import ForwardOutlinedIcon from '@mui/icons-material/ShortcutOutlined'
import ReplyAllOutlinedIcon from '@mui/icons-material/ReplyAllOutlined'
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { AnimatePresence } from 'framer-motion'

import { useEffect, useState } from 'react'

import { hasLabel, type Message, type ReplyKind } from '@/ui/mail'

import { ReplyForm } from './ReplyForm'
import { ThreadMessage } from './ThreadMessage'
import { ControlButton, ControlRow, Empty, Pane, PaneScroll, PaneSubject, ReplyButton, SendButton, SendError, StarButton, Status, ThreadList } from './styles'

type Props = {
  mailboxId: string
  message: Message | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string
  replying: boolean
  thread: Message[]
  ownerEmail: string
  sending: boolean
  sendError: string
  onStar: () => void
  onReply: () => void
  onSend: () => void
  onSendReply: (fields: { to: string[]; cc: string[]; subject?: string; body: string; replyToMessageId?: string }) => void
}

export function MessagePane({ mailboxId, message, thread, ownerEmail, status, error, replying, sending, sendError, onStar, onReply, onSend, onSendReply }: Props) {
  const [openIds, setOpenIds] = useState<string[]>([])
  const [kind, setKind] = useState<ReplyKind | null>(null)
  const messages = thread.length > 0 ? thread : message ? [message] : []
  const canCompose = Boolean(message && ownerEmail && !hasLabel(message.labels, 'DRAFT'))

  useEffect(() => {
    setOpenIds(message ? [message.id] : [])
    setKind(null)
  }, [message?.id])
  return (
    <Pane>
      {status === 'error' ? <Status>{error}</Status> : null}
      {status === 'idle' ? <Empty>Select a message</Empty> : null}
      {status === 'loading' && !message ? <Status>Opening…</Status> : null}
      <AnimatePresence mode="wait">
        {message ? (
          <PaneScroll
            key={message.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
          >
            <PaneSubject>{message.subject || '(no subject)'}</PaneSubject>
            {sendError && !kind ? <SendError>{sendError}</SendError> : null}
            <ThreadList>
              {messages.map(item => (
                <ThreadMessage
                  key={item.id}
                  mailboxId={mailboxId}
                  message={item}
                  current={item.id === message.id}
                  alone={messages.length === 1}
                  open={openIds.includes(item.id)}
                  onToggle={() => setOpenIds(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])}
                  actions={item.id === message.id ? (
                    <>
                      {hasLabel(message.labels, 'DRAFT') ? (
                        <SendButton type="button" disabled={sending} onClick={onSend}>
                          {sending ? 'Sending…' : 'Send'}
                        </SendButton>
                      ) : (
                        <ReplyButton type="button" disabled={replying} onClick={onReply}>
                          Write my response
                        </ReplyButton>
                      )}
                      <StarButton type="button" on={hasLabel(message.labels, 'STARRED')} aria-label="Star message" onClick={onStar}>
                        {hasLabel(message.labels, 'STARRED') ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                      </StarButton>
                    </>
                  ) : null}
                />
              ))}
            </ThreadList>
            {canCompose && message ? (
              <>
                <ControlRow>
                  <ControlButton type="button" on={kind === 'reply'} onClick={() => setKind('reply')}>
                    <ReplyOutlinedIcon fontSize="small" />
                    Reply
                  </ControlButton>
                  <ControlButton type="button" on={kind === 'reply-all'} onClick={() => setKind('reply-all')}>
                    <ReplyAllOutlinedIcon fontSize="small" />
                    Reply all
                  </ControlButton>
                  <ControlButton type="button" on={kind === 'forward'} onClick={() => setKind('forward')}>
                    <ForwardOutlinedIcon fontSize="small" />
                    Forward
                  </ControlButton>
                </ControlRow>
                {kind ? (
                  <ReplyForm
                    key={`${message.id}-${kind}`}
                    message={message}
                    ownerEmail={ownerEmail}
                    kind={kind}
                    sending={sending}
                    error={sendError}
                    onSend={onSendReply}
                    onDiscard={() => setKind(null)}
                  />
                ) : null}
              </>
            ) : null}
          </PaneScroll>
        ) : null}
      </AnimatePresence>
    </Pane>
  )
}
