import {fetchRequestHandler} from '@trpc/server/adapters/fetch'
import {type NextRequest} from 'next/server'

import {env} from '@/env.mjs'
import {appRouter} from '@/trpc/api/root'
import {createTRPCContext} from '@/trpc/api/trpc'
import {withSkill} from '@/server/with-skill'

const handler = withSkill((req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({req}),
    onError:
      env.NODE_ENV === 'development'
        ? ({path, error}) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            )
          }
        : undefined,
  }),
)

export {handler as GET, handler as POST}
