import { type NextRequest } from 'next/server'
import { env } from '@/env.mjs'
import { appRouter } from '@/trpc/api/root'
import { createTRPCContext } from '@/trpc/api/trpc'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createApiContext = async (req: NextRequest) => {
	return createTRPCContext({
		headers: req.headers,
	})
}

const apiHandler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: appRouter,
		createContext: () => createApiContext(req),
		onError:
			env.NODE_ENV === 'development'
				? ({ path, error }) => {
						console.error(
							`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
						)
					}
				: undefined,
	})

export { apiHandler as GET, apiHandler as POST }
