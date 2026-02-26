import { NextResponse } from 'next/server'
import { getWorkshopViaApi } from '@/lib/workshops-query'
import { log } from '@/server/logger'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params

	try {
		const workshop = await getWorkshopViaApi(slug)

		if (!workshop) {
			return NextResponse.json(null, { headers: corsHeaders })
		}

		return NextResponse.json(workshop, { headers: corsHeaders })
	} catch (error) {
		await log.error('api.workshops.get.failed', {
			slug,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})

		return NextResponse.json(null, { headers: corsHeaders })
	}
}

export const dynamic = 'force-dynamic'
