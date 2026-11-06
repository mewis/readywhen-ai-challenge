import { z } from 'zod'

export const groundTruthSchema = z.discriminatedUnion('shouldSend', [
  z.object({ shouldSend: z.literal(false), unclear: z.literal(true).optional() }),
  z.object({ shouldSend: z.literal(true), to: z.string().trim().min(1) }),
])

export type GroundTruth = z.infer<typeof groundTruthSchema>
