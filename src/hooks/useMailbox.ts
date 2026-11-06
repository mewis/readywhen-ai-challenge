'use client'

import { useEffect, useState } from 'react'

import { useMailboxId } from '@/hooks/useMailboxId'
import { getMailbox } from '@/services/mail'
import type { Mailbox } from '@/ui/mail'

export function useMailbox() {
  const mailboxId = useMailboxId()
  const [mailbox, setMailbox] = useState<Mailbox | null>(null)

  useEffect(() => {
    const control = new AbortController()
    getMailbox(mailboxId, control.signal)
      .then(setMailbox)
      .catch(() => setMailbox(null))
    return () => control.abort()
  }, [mailboxId])

  return mailbox
}
