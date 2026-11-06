'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type MailboxChoice = { id: string; setId: (id: string) => void }

const MailboxChoiceContext = createContext<MailboxChoice>({ id: 'main', setId: () => {} })

export function MailboxProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState('main')
  return <MailboxChoiceContext.Provider value={{ id, setId }}>{children}</MailboxChoiceContext.Provider>
}

export function useMailboxId(): string {
  return useContext(MailboxChoiceContext).id
}

export function useSetMailboxId(): (id: string) => void {
  return useContext(MailboxChoiceContext).setId
}
