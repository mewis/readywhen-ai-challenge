'use client'

import type { ReactNode } from 'react'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import { AnimatePresence } from 'framer-motion'

import { Dock, Fab, Stage } from '@/components/chat/styles'
import { Header, type AppMode } from '@/components/header/Header'

import { ListColumn, ListHeading, Shell, Workspace } from './styles'

type Props = {
  owner: string
  mode: AppMode
  onMode: (mode: AppMode) => void
  title: string
  query: string
  onQuery: (value: string) => void
  nav: ReactNode
  list: ReactNode
  pane: ReactNode
  chat: ReactNode
  chatOpen: boolean
  onChatOpen: () => void
}

export function Inbox({ owner, mode, onMode, title, query, onQuery, nav, list, pane, chat, chatOpen, onChatOpen }: Props) {
  return (
    <Shell>
      <Header owner={owner} mode={mode} onMode={onMode} query={query} onQuery={onQuery} />
      {mode === 'inbox' ? (
        <Workspace>
          {nav}
          <ListColumn>
            <ListHeading>{title}</ListHeading>
            {list}
          </ListColumn>
          {pane}
        </Workspace>
      ) : (
        <Stage>{chat}</Stage>
      )}
      <AnimatePresence>
        {mode === 'inbox' && chatOpen ? (
          <Dock key="dock" initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }} transition={{ duration: 0.18 }}>
            {chat}
          </Dock>
        ) : null}
        {mode === 'inbox' && !chatOpen ? (
          <Fab key="fab" type="button" aria-label="Open agent" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.16 }} onClick={onChatOpen}>
            <ChatOutlinedIcon />
          </Fab>
        ) : null}
      </AnimatePresence>
    </Shell>
  )
}
