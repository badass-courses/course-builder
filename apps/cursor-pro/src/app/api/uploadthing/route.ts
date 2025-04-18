import { withSkill } from '@/server/with-skill'
import { ourFileRouter } from '@/uploadthing/core'
import { createRouteHandler } from 'uploadthing/next'

const handlers = createRouteHandler({
	router: ourFileRouter,
})

export const GET = withSkill(handlers.GET)
export const POST = withSkill(handlers.POST)
