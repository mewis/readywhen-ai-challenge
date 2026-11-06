import { MailboxProvider } from '@/hooks/useMailboxId'

import { InboxPage } from './pages/InboxPage'

export default function Page() {
  return (
    <MailboxProvider>
      <InboxPage />
    </MailboxProvider>
  )
}
