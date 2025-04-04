import { NextRequest, NextResponse } from 'next/server'

export type SkillRequest = NextRequest

type NextHandler<T = any> = (
	req: SkillRequest,
	arg?: T,
) => Promise<Response> | Promise<NextResponse> | NextResponse | Response

export function withSkill(params: NextHandler): NextHandler {
	return params
}
