'use client'

import { useEffect, useRef, useState } from 'react'

import { useMailboxId } from '@/hooks/useMailboxId'
import { searchMessages } from '@/services/mail'
import type { MessageSummary } from '@/ui/mail'

type State = { messages: MessageSummary[]; status: 'loading' | 'ready' | 'error'; error: string }

export function useMessages(folder: string, text: string, tick: number) {
  const mailboxId = useMailboxId()
  const [state, setState] = useState<State>({ messages: [], status: 'loading', error: '' })
  const scope = useRef(`${mailboxId}\n${folder}\n${text}`)

  useEffect(() => {
    const control = new AbortController()
    const nextScope = `${mailboxId}\n${folder}\n${text}`
    const sameList = scope.current === nextScope
    scope.current = nextScope
    setState(current => ({ messages: sameList ? current.messages : [], status: 'loading', error: '' }))
    searchMessages(mailboxId, folder, text, control.signal)
      .then(data => setState({ messages: data.messages, status: 'ready', error: '' }))
      .catch(error => {
        if (error instanceof Error && error.name === 'AbortError') return
        setState({ messages: [], status: 'error', error: error instanceof Error ? error.message : 'The inbox could not be loaded.' })
      })
    return () => control.abort()
  }, [mailboxId, folder, text, tick])

  return state
}
