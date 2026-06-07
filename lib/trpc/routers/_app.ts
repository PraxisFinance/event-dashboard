import { router } from '../init'
import { eventsRouter } from './events'
import { sourceRouter } from './source'
import { rydRouter } from './ryd'
import { subscriptionsRouter } from './subscriptions'
import { twopoolRouter } from './twopool'

export const appRouter = router({
  events: eventsRouter,
  source: sourceRouter,
  subscriptions: subscriptionsRouter,
  ryd: rydRouter,
  twopool: twopoolRouter,
})

export type AppRouter = typeof appRouter
