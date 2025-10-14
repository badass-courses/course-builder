import { NextResponse } from 'next/server'
import { getProviderData } from '@vercel/flags/next'

import { flagInstances } from '../../../../flags'

export const runtime = 'edge'
export const dynamic = 'force-dynamic' // defaults to auto

export async function GET() {
	const data = await getProviderData(flagInstances)
	return NextResponse.json(data)
}
