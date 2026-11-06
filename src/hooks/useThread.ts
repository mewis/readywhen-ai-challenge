'use client'

import { useEffect, useState } from 'react'

import { useMailboxId } from '@/hooks/useMailboxId'
import { getThread } from '@/services/mail'
import type { Message } from '@/ui/mail'

type State = { id: string | null; messages: Message[]; status: 'idle' | 'loading' | 'ready' | 'error'; error: string }

export function useThread(threadId: string | null, tick: number) {
  const mailboxId = useMailboxId()
  const [state, setState] = useState<State>({ id: null, messages: [], status: 'idle', error: '' })

  useEffect(() => {
    if (!threadId) {
      setState({ id: null, messages: [], status: 'idle', error: '' })
      return
    }
    const control = new AbortController()
    setState(current => ({
      id: threadId,
      messages: current.id === threadId ? current.messages : [],
      status: 'loading',
      error: '',
    }))
    getThread(mailboxId, threadId, control.signal)
      .then(messages => setState({ id: threadId, messages, status: 'ready', error: '' }))
      .catch(error => {
        if (error instanceof Error && error.name === 'AbortError') return
        setState({ id: threadId, messages: [], status: 'error', error: error instanceof Error ? error.message : 'The thread could not be opened.' })
      })
    return () => control.abort()
  }, [mailboxId, threadId, tick])

  return state
}
