'use client'

import { useMailboxId } from '@/hooks/useMailboxId'
import { useMessages } from '@/hooks/useMessages'
import type { FolderId } from '@/ui/folders'
import { changeLabels } from '@/services/mail'
import { hasLabel, type MessageSummary } from '@/ui/mail'

import { MessageList } from './MessageList'

type Props = {
  folder: FolderId
  text: string
  query: string
  tick: number
  selectedId: string | null
  replying: boolean
  onOpen: (id: string) => void
  onReply: (message: MessageSummary) => void
  onChanged: () => void
  asking?: boolean
  onAsk?: () => void
}

export function MessageListContainer({ folder, text, query, tick, selectedId, replying, onOpen, onReply, onChanged, asking, onAsk }: Props) {
  const mailboxId = useMailboxId()
  const { messages, status, error } = useMessages(folder, text, tick)

  function star(message: MessageSummary) {
    const starred = hasLabel(message.labels, 'STARRED')
    changeLabels(mailboxId, [message.id], starred ? [] : ['STARRED'], starred ? ['STARRED'] : []).then(onChanged).catch(() => {})
  }

  return (
    <MessageList
      messages={messages}
      status={status}
      error={error}
      query={query}
      selectedId={selectedId}
      replying={replying}
      onOpen={onOpen}
      onStar={star}
      onReply={onReply}
      asking={asking}
      onAsk={onAsk}
    />
  )
}
