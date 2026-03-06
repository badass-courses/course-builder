import { NextRequest, NextResponse } from 'next/server'
import { courseBuilderAdapter } from '@/db'
import { registry } from '@/lib/content-model/registry'
import { getUserAbilityForRequest } from '@/server/ability-for-request'

import {
	createAdminOnlyPolicy,
	createLink,
	deleteLink,
} from '@coursebuilder/content-api'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
	const { user } = await getUserAbilityForRequest(request)

	const apiUser = user
		? { id: user.id, email: user.email ?? undefined, role: user.role ?? undefined }
		: undefined

	const body = await request.json()

	const result = await createLink(body, {
		adapter: courseBuilderAdapter as any,
		authorize: createAdminOnlyPolicy(),
		registry,
		user: apiUser,
	})

	return NextResponse.json(result.body, {
		status: result.status,
		headers: corsHeaders,
	})
}

export async function DELETE(request: NextRequest) {
	const { user } = await getUserAbilityForRequest(request)

	const apiUser = user
		? { id: user.id, email: user.email ?? undefined, role: user.role ?? undefined }
		: undefined

	const body = await request.json()

	const result = await deleteLink(body, {
		adapter: courseBuilderAdapter as any,
		authorize: createAdminOnlyPolicy(),
		registry,
		user: apiUser,
	})

	return NextResponse.json(result.body, {
		status: result.status,
		headers: corsHeaders,
	})
}
