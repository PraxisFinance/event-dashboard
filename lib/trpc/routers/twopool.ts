import { protectedProcedure, router } from '../init'

export const twopoolRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.twoPoolContract.findMany({
      orderBy: { createdAt: 'desc' },
    })
  ),
})
