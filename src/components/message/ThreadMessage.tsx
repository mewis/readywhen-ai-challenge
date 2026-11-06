'use client'

import { useState, type ReactNode } from 'react'

import { getAttachment } from '@/services/mail'
import { formatWhen, initial, person, type Attachment, type Message } from '@/ui/mail'

import { Avatar, FileBody, FileButton, FileMeta, FileName, Files, PaneHead, ReplyButton, SendError, Snippet, ThreadBody, ThreadCard, ThreadToggle, Who, WhoMeta, WhoName } from './styles'

type Props = {
  mailboxId: string
  message: Message
  current: boolean
  alone: boolean
  open: boolean
  onToggle: () => void
  actions?: ReactNode
}

export function ThreadMessage({ mailboxId, message, current, alone, open, onToggle, actions }: Props) {
  const name = person(message.from)
  const shown = alone || open
  const snippet = message.body.replace(/\s+/g, ' ').trim()

  return (
    <ThreadCard current={current && !alone}>
      {shown ? (
        <>
          <PaneHead>
            <Avatar>{initial(name)}</Avatar>
            <Who>
              <WhoName>{name}</WhoName>
              <WhoMeta>
                to {message.to.map(person).join(', ') || 'undisclosed'}
                {message.cc.length > 0 ? `, cc ${message.cc.map(person).join(', ')}` : ''}, {formatWhen(message.date, true)}
              </WhoMeta>
            </Who>
            {current ? actions : null}
            {alone ? null : (
              <ReplyButton type="button" aria-expanded="true" onClick={onToggle}>
                Hide
              </ReplyButton>
            )}
          </PaneHead>
          <Attachments mailboxId={mailboxId} messageId={message.id} files={message.attachments ?? []} />
          <ThreadBody>{message.body}</ThreadBody>
        </>
      ) : (
        <ThreadToggle type="button" aria-expanded="false" aria-label={`Show message from ${name}`} onClick={onToggle}>
          <Avatar>{initial(name)}</Avatar>
          <WhoName>{name}</WhoName>
          <Snippet>{snippet}</Snippet>
          <WhoMeta>{formatWhen(message.date)}</WhoMeta>
        </ThreadToggle>
      )}
    </ThreadCard>
  )
}

function Attachments({ mailboxId, messageId, files }: { mailboxId: string; messageId: string; files: Attachment[] }) {
  if (files.length === 0) return null
  return (
    <Files>
      {files.map(file => (
        <AttachmentFile key={file.id} mailboxId={mailboxId} messageId={messageId} file={file} />
      ))}
    </Files>
  )
}

function AttachmentFile({ mailboxId, messageId, file }: { mailboxId: string; messageId: string; file: Attachment }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState('')

  function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (content !== null) return
    getAttachment(mailboxId, messageId, file.id)
      .then(attachment => setContent(attachment.content ?? ''))
      .catch(caught => setError(caught instanceof Error ? caught.message : 'The attachment could not be opened.'))
  }

  return (
    <div>
      <FileButton type="button" aria-expanded={open} onClick={toggle}>
        <FileName>{file.filename}</FileName>
        <FileMeta>{fileSize(file.size)}</FileMeta>
      </FileButton>
      {open && error ? <SendError>{error}</SendError> : null}
      {open && !error && content === null ? <FileMeta>Opening…</FileMeta> : null}
      {open && content !== null ? <FileBody>{content}</FileBody> : null}
    </div>
  )
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
