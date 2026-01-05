/**
 * Query configuration for epic-react app.
 * Centralizes auth settings for query utilities.
 */
import { getServerAuthSession } from '@/server/auth'

import {
	createAuthConfig,
	type AuthConfig,
	type AuthLogger,
} from '@coursebuilder/next/query'

// Create a simple console-based logger wrapper
const authLogger: AuthLogger = {
	error: (event, data) => {
		console.error(`[Auth Error] ${event}`, data ?? {})
	},
	info: (event, data) => {
		console.info(`[Auth Info] ${event}`, data ?? {})
	},
}

/**
 * Auth configuration for epic-react.
 * Use with withAuthorization, withResourceAuthorization, requireAuth.
 */
export const authConfig: AuthConfig = {
	getAuth: async () => {
		const result = await getServerAuthSession()
		return {
			session: result.session,
			ability: {
				can: (action: string, subject: unknown, field?: string) =>
					result.ability.can(action as any, subject as any, field),
			},
		}
	},
	logger: authLogger,
}
