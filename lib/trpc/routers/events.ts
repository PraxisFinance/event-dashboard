import { z } from 'zod'
import { protectedProcedure, router } from '../init'

const eventStatusZ = z.enum(['open', 'resolved', 'cancelled'])
const eventSourceZ = z.enum(['praxis', 'source'])

const categoryZ = z.enum(['crypto', 'esports', 'sport', 'politics', 'tech', 'finance'])
const resolutionTypeZ = z.enum(['up_down', 'above_below', 'price_range', 'hit', 'winner', 'yes_no'])

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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        slug: z.string().nullable().optional(),
        logoPath: z.string().nullable().optional(),
        category: categoryZ.nullable().optional(),
        resolutionType: resolutionTypeZ.nullable().optional(),
        sideALabel: z.string().nullable().optional(),
        sideBLabel: z.string().nullable().optional(),
        metadata: z.record(z.unknown()).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, metadata, ...rest } = input
      return ctx.db.event.update({
        where: { id },
        data: {
          ...rest,
          ...(metadata !== undefined && { metadata: metadata ?? undefined }),
        },
      })
    }),
})
