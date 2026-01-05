import { NextRequest, NextResponse } from 'next/server.js'

export type SkillRequest = NextRequest

type NextHandler<T = any> = (
	req: SkillRequest,
	arg?: T,
) => Promise<Response> | Promise<NextResponse> | NextResponse | Response

/**
 * Wrapper function for Next.js route handlers.
 * Provides type-safe request handling for skill-based routes.
 *
 * @param params - The route handler function
 * @returns The wrapped handler
 *
 * @example
 * ```ts
 * export const GET = withSkill(async (req) => {
 *   return NextResponse.json({ data: 'example' })
 * })
 * ```
 */
export function withSkill(params: NextHandler): NextHandler {
	return params
}
