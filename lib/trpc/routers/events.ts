import { z } from 'zod'
import { protectedProcedure, router } from '../init'

const eventStatusZ = z.enum(['open', 'resolved', 'cancelled'])
const eventSourceZ = z.enum(['praxis', 'source'])

export const eventsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: eventStatusZ.optional(),
          source: eventSourceZ.optional(),
          onPlatform: z.boolean().optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) =>
      ctx.db.event.findMany({
        where: {
          ...(input?.status && { status: input.status }),
          ...(input?.source && { source: input.source }),
          ...(typeof input?.onPlatform === 'boolean' && { onPlatform: input.onPlatform }),
        },
        orderBy: { updatedAt: 'desc' },
      })
    ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.event.findFirst({
        where: { id: input.id },
      })
    ),
})
