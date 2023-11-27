import {createNextRouteHandler} from '@coursebuilder/next'
import {FileRouter} from '@coursebuilder/next/internal/types'

const ourFileRouter: FileRouter = {}

// Export routes for Next App Router
export const {GET, POST} = createNextRouteHandler({
  router: ourFileRouter,
})
