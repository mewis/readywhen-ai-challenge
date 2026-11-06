'use client'

import { useEffect, useState } from 'react'

import { useMailboxId } from '@/hooks/useMailboxId'
import { getMessage } from '@/services/mail'
import type { Message } from '@/ui/mail'

type State = { message: Message | null; status: 'idle' | 'loading' | 'ready' | 'error'; error: string }

export function useMessage(id: string | null, tick: number) {
  const mailboxId = useMailboxId()
  const [state, setState] = useState<State>({ message: null, status: 'idle', error: '' })

  useEffect(() => {
    if (!id) {
      setState({ message: null, status: 'idle', error: '' })
      return
    }
    const control = new AbortController()
    setState(current => ({
      message: current.message?.id === id ? current.message : null,
      status: 'loading',
      error: '',
    }))
    getMessage(mailboxId, id, control.signal)
      .then(message => setState({ message, status: 'ready', error: '' }))
      .catch(error => {
        if (error instanceof Error && error.name === 'AbortError') return
        setState({ message: null, status: 'error', error: error instanceof Error ? error.message : 'The message could not be opened.' })
      })
    return () => control.abort()
  }, [mailboxId, id, tick])

  return state
}
