import { protectedProcedure, router } from '../init'

export const rydRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.rydContract.findMany({
      orderBy: { createdAt: 'desc' },
    })
  ),
})
