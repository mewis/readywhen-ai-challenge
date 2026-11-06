'use client'

import { useState } from 'react'

import { useMailboxId } from '@/hooks/useMailboxId'
import { createMailbox } from '@/services/mail'

import { DevButton, DevNote, DevSlot } from './styles'

type Props = {
  onCreated: (id: string) => void
}

export function DevMailbox({ onCreated }: Props) {
  const mailboxId = useMailboxId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const testing = mailboxId !== 'main'

  async function create() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const mailbox = await createMailbox()
      onCreated(mailbox.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'A new mailbox could not be created.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DevSlot>
      <DevButton type="button" disabled={busy} onClick={create}>
        {busy ? 'Creating…' : 'New test mailbox'}
      </DevButton>
      <DevNote>{testing ? 'For testing only. This inbox is fresh.' : 'For testing only. Loads a fresh copy of the inbox.'}</DevNote>
      {error ? <DevNote>{error}</DevNote> : null}
    </DevSlot>
  )
}
