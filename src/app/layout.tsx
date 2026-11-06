import type { ReactNode } from 'react'
import { Roboto } from 'next/font/google'

import { Providers } from './providers'

const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'Inbox',
  description: "Elena Conti's mail",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={roboto.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
