'use client'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {loggerLink, unstable_httpBatchStreamLink} from '@trpc/client'
import {createTRPCReact} from '@trpc/react-query'
import {useState} from 'react'

import {type AppRouter} from '@/trpc/api/root'
import {getUrl, transformer} from './shared'

export const api = createTRPCReact<AppRouter>({
  overrides: {
    useMutation: {
      async onSuccess(opts) {
        /**
         * @note that order here matters:
         * The order here allows route changes in `onSuccess` without
         * having a flash of content change whilst redirecting.
         **/
        // Calls the `onSuccess` defined in the `useQuery()`-options:
        await opts.originalFn()
        // Invalidate all queries in the react-query cache:
        await opts.queryClient.invalidateQueries()
      },
    },
  },
})

export function TRPCReactProvider(props: {
  children: React.ReactNode
  headers: Headers
}) {
  const [queryClient] = useState(() => new QueryClient())

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          url: getUrl(),
          headers() {
            const heads = new Map(props.headers)
            heads.set('x-trpc-source', 'react')
            return Object.fromEntries(heads)
          },
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  )
}
