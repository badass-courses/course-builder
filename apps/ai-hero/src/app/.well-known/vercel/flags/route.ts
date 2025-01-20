import { NextResponse, type NextRequest } from 'next/server'
import { verifyAccess, type ApiData } from '@vercel/flags'
import { getProviderData } from '@vercel/flags/next'

import { flagInstances } from '../../../../lib/flags'

export const runtime = 'edge'
export const dynamic = 'force-dynamic' // defaults to auto

export async function GET(request: NextRequest) {
	const access = await verifyAccess(request.headers.get('Authorization'))
	if (!access) return NextResponse.json(null, { status: 401 })

	const providerData = getProviderData(flagInstances)
	return NextResponse.json<ApiData>(providerData)
}
