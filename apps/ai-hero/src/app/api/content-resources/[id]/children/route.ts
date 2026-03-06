import { NextRequest, NextResponse } from 'next/server'
import { courseBuilderAdapter } from '@/db'
import { getUserAbilityForRequest } from '@/server/ability-for-request'

import {
	createOpenPolicy,
	getChildren,
} from '@coursebuilder/content-api'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params
	const { user } = await getUserAbilityForRequest(request)

	const apiUser = user
		? { id: user.id, email: user.email ?? undefined, role: user.role ?? undefined }
		: undefined

	const result = await getChildren(id, {
		adapter: courseBuilderAdapter as any,
		authorize: createOpenPolicy(),
		user: apiUser,
	})

	return NextResponse.json(result.body, {
		status: result.status,
		headers: corsHeaders,
	})
}
