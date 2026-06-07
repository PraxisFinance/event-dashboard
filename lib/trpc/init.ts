import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function createContext() {
  const session = await auth()
  return { session, db }
}

type Context = Awaited<ReturnType<typeof createContext>>
const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, session: ctx.session } })
})
