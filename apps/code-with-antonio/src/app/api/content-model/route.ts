import { NextRequest, NextResponse } from 'next/server'
import { courseBuilderAdapter } from '@/db'
import { registry } from '@/lib/content-model/registry'
import { getUserAbilityForRequest } from '@/server/ability-for-request'

import { createOpenPolicy, getContentModel } from '@coursebuilder/content-api'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
	const { user } = await getUserAbilityForRequest(request)

	const contentApiUser = user
		? { id: user.id, role: user.role ?? undefined, email: user.email ?? undefined }
		: undefined

	const result = await getContentModel({
		adapter: courseBuilderAdapter as any,
		authorize: createOpenPolicy(),
		registry,
		user: contentApiUser,
	})

	return NextResponse.json(result.body, {
		status: result.status,
		headers: corsHeaders,
	})
}
