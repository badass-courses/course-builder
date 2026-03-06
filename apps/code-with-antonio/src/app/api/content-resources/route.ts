import { NextRequest, NextResponse } from 'next/server'
import { courseBuilderAdapter } from '@/db'
import { getUserAbilityForRequest } from '@/server/ability-for-request'

import { registry } from '@/lib/content-model/registry'

import {
	ContentResourceQuerySchema,
	createAdminOnlyPolicy,
	createOpenPolicy,
	createResource,
	listResources,
} from '@coursebuilder/content-api'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const { user } = await getUserAbilityForRequest(request)

	const params = ContentResourceQuerySchema.parse({
		type: searchParams.get('type') ?? undefined,
		state: searchParams.get('state') ?? undefined,
		visibility: searchParams.get('visibility') ?? undefined,
		organizationId: searchParams.get('organizationId') ?? undefined,
		search: searchParams.get('search') ?? undefined,
		page: searchParams.get('page') ?? undefined,
		limit: searchParams.get('limit') ?? undefined,
		sort: searchParams.get('sort') ?? undefined,
		order: searchParams.get('order') ?? undefined,
	})

	const apiUser = user
		? { id: user.id, email: user.email ?? undefined, role: user.role ?? undefined }
		: undefined

	const result = await listResources(params, {
		adapter: courseBuilderAdapter as any,
		authorize: createOpenPolicy(),
		user: apiUser,
	})

	return NextResponse.json(result.body, {
		status: result.status,
		headers: corsHeaders,
	})
}

export async function POST(request: NextRequest) {
	const { user } = await getUserAbilityForRequest(request)

	const apiUser = user
		? { id: user.id, email: user.email ?? undefined, role: user.role ?? undefined }
		: undefined

	const body = await request.json()

	const result = await createResource(body, {
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
