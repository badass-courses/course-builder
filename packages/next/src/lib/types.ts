import type { NextRequest } from 'next/server.js'

import { CourseBuilderSession } from '@coursebuilder/core/types'

/**
 * AppRouteHandlerFnContext is the context that is passed to the handler as the
 * second argument.
 */
type AppRouteHandlerFnContext = {
	params?: Record<string, string | string[]>
}
/**
 * Handler function for app routes. If a non-Response value is returned, an error
 * will be thrown.
 */
export type AppRouteHandlerFn = (
	/**
	 * Incoming request object.
	 */
	req: NextRequest,
	/**
	 * Context properties on the request (including the parameters if this was a
	 * dynamic route).
	 */
	ctx: AppRouteHandlerFnContext,
) => void | Response | Promise<void | Response>
