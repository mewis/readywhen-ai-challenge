'use client'

import { useEffect, useState } from 'react'

import { useMailboxId } from '@/hooks/useMailboxId'
import { getLabels } from '@/services/mail'
import type { LabelCount } from '@/ui/mail'

type State = { labels: LabelCount[]; status: 'loading' | 'ready' | 'error' }

export function useLabels(tick: number) {
  const mailboxId = useMailboxId()
  const [state, setState] = useState<State>({ labels: [], status: 'loading' })

  useEffect(() => {
    const control = new AbortController()
    setState(current => ({ ...current, status: 'loading' }))
    getLabels(mailboxId, control.signal)
      .then(labels => setState({ labels, status: 'ready' }))
      .catch(error => {
        if (error instanceof Error && error.name === 'AbortError') return
        setState({ labels: [], status: 'error' })
      })
    return () => control.abort()
  }, [mailboxId, tick])

  return state
}
