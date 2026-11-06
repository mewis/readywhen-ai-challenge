'use client'

import { useCallback, useEffect, useState } from 'react'

import { Chat } from '@/components/chat/Chat'
import type { AppMode } from '@/components/header/Header'
import { FolderNavContainer } from '@/components/inbox/FolderNavContainer'
import { Inbox } from '@/components/inbox/Inbox'
import { MessageListContainer } from '@/components/inbox/MessageListContainer'
import { MessagePaneContainer } from '@/components/message/MessagePaneContainer'
import { useChat } from '@/hooks/useChat'
import { useDebounced } from '@/hooks/useDebounced'
import { useMailbox } from '@/hooks/useMailbox'
import { useSetMailboxId } from '@/hooks/useMailboxId'
import { folderLabel, type FolderId } from '@/ui/folders'
import { person, replyRequest } from '@/ui/mail'

export function InboxPage() {
  const mailbox = useMailbox()
  const setMailboxId = useSetMailboxId()
  const [mode, setMode] = useState<AppMode>('inbox')
  const [chatOpen, setChatOpen] = useState(true)
  const [folder, setFolder] = useState<FolderId>('INBOX')
  const [query, setQuery] = useState('')
  const text = useDebounced(query)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(value => value + 1), [])
  const chat = useChat(draftId => {
    refresh()
    if (!draftId) return
    setMode('inbox')
    setChatOpen(true)
    setFolder('DRAFT')
    setQuery('')
    setSelectedId(draftId)
  })

  function openFreshMailbox(id: string) {
    setMailboxId(id)
    setMode('inbox')
    setFolder('INBOX')
    setQuery('')
    setSelectedId(null)
  }

  function sent(id: string) {
    refresh()
    setFolder('SENT')
    setQuery('')
    setSelectedId(id)
  }

  function askPriority() {
    setMode('inbox')
    setChatOpen(true)
    setFolder('PRIORITY')
    setQuery('')
    setSelectedId(null)
    chat.onSend('What needs me?')
  }

  function writeResponse(id: string, name: string) {
    const request = replyRequest(id, name)
    setMode('inbox')
    setChatOpen(true)
    chat.onSend(request.text, request.shown)
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Inbox
      owner={mailbox ? person(mailbox.owner) : 'Elena Conti'}
      mode={mode}
      onMode={setMode}
      title={folderLabel(folder)}
      query={query}
      onQuery={setQuery}
      nav={<FolderNavContainer folder={folder} tick={tick} onSelect={id => { setFolder(id); setSelectedId(null) }} onNewMailbox={openFreshMailbox} />}
      list={
        <MessageListContainer
          folder={folder}
          text={text}
          query={query}
          tick={tick}
          selectedId={selectedId}
          replying={chat.pending}
          onOpen={setSelectedId}
          onReply={message => writeResponse(message.id, person(message.from))}
          onChanged={refresh}
          asking={chat.pending}
          onAsk={folder === 'PRIORITY' ? askPriority : undefined}
        />
      }
      pane={
        <MessagePaneContainer
          id={selectedId}
          tick={tick}
          ownerEmail={mailbox?.owner.email ?? ''}
          replying={chat.pending}
          onReply={writeResponse}
          onSent={sent}
          onChanged={refresh}
        />
      }
      chatOpen={chatOpen}
      onChatOpen={() => setChatOpen(true)}
      chat={<Chat {...chat} onClose={mode === 'inbox' ? () => setChatOpen(false) : undefined} />}
    />
  )
}
