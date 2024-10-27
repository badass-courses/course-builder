import { NextResponse } from 'next/server'
import { getAllEggheadTagsCached } from '@/lib/tags-query'

export const revalidate = 60 * 60 * 0.25 // every 15 minutes

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
	const tags = await getAllEggheadTagsCached()
	return NextResponse.json(tags, { headers: corsHeaders })
}
