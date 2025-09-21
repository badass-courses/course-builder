import { NextRequest, NextResponse } from 'next/server'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { getWorkshopViaApi } from '@/lib/workshops-query'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { subject } from '@casl/ability'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(
	request: NextRequest,
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
		return NextResponse.json(null, { headers: corsHeaders })
	}
}

export const dynamic = 'force-dynamic'
