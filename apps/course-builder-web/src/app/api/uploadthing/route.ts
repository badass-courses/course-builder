import { withSkill } from '@/server/with-skill'
import { createNextRouteHandler } from 'uploadthing/next'

import { ourFileRouter } from './core'

const handlers = createNextRouteHandler({
  router: ourFileRouter,
})

export const GET = withSkill(handlers.GET)
export const POST = withSkill(handlers.POST)
