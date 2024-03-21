import { NextRequest, NextResponse } from 'next/server'
import { withAxiom } from 'next-axiom'
import { Logger } from 'next-axiom/src/logger'

export type SkillRequest = NextRequest & { log: Logger }

type NextHandler<T = any> = (
	req: SkillRequest,
	arg?: T,
) => Promise<Response> | Promise<NextResponse> | NextResponse | Response

export function withSkill(params: NextHandler): NextHandler {
	return withAxiom(params)
}
