import { protectedProcedure, router } from '../init'

export const subscriptionsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.subscription.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ),
})
