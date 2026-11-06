'use client'

import Skeleton from '@mui/material/Skeleton'
import { motion } from 'framer-motion'

import type { MessageSummary } from '@/ui/mail'

import { MessageRow } from './MessageRow'
import { Empty, List, ListScroll, PriorityEmpty, Status } from './styles'

type Props = {
  messages: MessageSummary[]
  status: 'loading' | 'ready' | 'error'
  error: string
  query: string
  selectedId: string | null
  replying: boolean
  onOpen: (id: string) => void
  onStar: (message: MessageSummary) => void
  onReply: (message: MessageSummary) => void
  asking?: boolean
  onAsk?: () => void
}

export function MessageList({ messages, status, error, query, selectedId, replying, onOpen, onStar, onReply, asking, onAsk }: Props) {
  if (status === 'error') return <Status>{error}</Status>
  if (status === 'loading' && messages.length === 0) {
    return (
      <ListScroll>
        <List>
          {[0, 1, 2, 3, 4, 5].map(item => (
            <Skeleton key={item} height={40} />
          ))}
        </List>
      </ListScroll>
    )
  }
  if (messages.length === 0) {
    if (onAsk && !query.trim()) {
      return (
        <Empty>
          <PriorityEmpty type="button" disabled={asking} onClick={onAsk}>
            Ask what needs you.
          </PriorityEmpty>
        </Empty>
      )
    }
    return <Empty>{query.trim() ? 'Nothing matches that search.' : 'This folder is empty.'}</Empty>
  }

  return (
    <ListScroll>
      <List>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(index, 12) * 0.02 }}
          >
            <MessageRow
              message={message}
              selected={message.id === selectedId}
              replying={replying}
              onOpen={() => onOpen(message.id)}
              onStar={() => onStar(message)}
              onReply={() => onReply(message)}
            />
          </motion.div>
        ))}
      </List>
    </ListScroll>
  )
}
