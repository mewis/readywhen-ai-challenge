import { Mastra } from '@mastra/core'
import { PinoLogger } from '@mastra/loggers'
import { MastraStorageExporter, Observability } from '@mastra/observability'
import { PostgresStore } from '@mastra/pg'

import { inbox } from './agents/inbox'
import { asksOneQuestion } from './scorers/asks-one-question'
import { chatFormat } from './scorers/chat-format'
import { dontSend } from './scorers/dont-send'
import { emailFormat } from './scorers/email-format'
import { shouldSend } from './scorers/should-send'

export const mastra = new Mastra({
  agents: { inbox },
  scorers: { dontSend, shouldSend, chatFormat, emailFormat, asksOneQuestion },
  storage: new PostgresStore({
    id: 'mastra',
    connectionString: process.env.DATABASE_URL ?? 'postgres://inbox:inbox@localhost:54320/inbox',
    schemaName: 'mastra',
  }),
  // `npm run eval` sets EVAL=1. Studio keeps the exporter so traces still show up.
  ...(process.env.EVAL === '1'
    ? {}
    : {
        observability: new Observability({
          configs: {
            default: {
              serviceName: 'inbox',
              exporters: [new MastraStorageExporter()],
              requestContextKeys: ['mailboxId'],
            },
          },
        }),
      }),
  logger: new PinoLogger({ name: 'inbox', level: 'info' }),
})
