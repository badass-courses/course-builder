import { withSkill } from '@/server/with-skill'
import { ourFileRouter } from '@/uploadthing/core'
import { createNextRouteHandler } from 'uploadthing/next'

const handlers = createNextRouteHandler({
  router: ourFileRouter,
})

export const GET = withSkill(handlers.GET)
export const POST = withSkill(handlers.POST)
