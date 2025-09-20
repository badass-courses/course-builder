import { NextRequest, NextResponse } from 'next/server'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { getWorkshop } from '@/lib/workshops-query'
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
		const { user } = await getUserAbilityForRequest(request)

		if (!user) {
			return NextResponse.json(false, { headers: corsHeaders })
		}

		// Get workshop to check start date
		const workshop = await getWorkshop(slug)
		if (!workshop) {
			return NextResponse.json(false, { headers: corsHeaders })
		}

		// Get user purchases and create ability rules with device token user
		const purchases = await courseBuilderAdapter.getPurchasesForUser(user.id)
		const allEntitlementTypes = await db.query.entitlementTypes.findMany()

		const abilityRules = defineRulesForPurchases({
			user,
			purchases,
			module: workshop,
			entitlementTypes: allEntitlementTypes,
			country: request.headers.get('x-vercel-ip-country') || 'US',
		})

		const ability = createAppAbility(abilityRules || [])

		// Check content access (ability system already handles startsAt logic)
		const hasContentAccess = ability.can(
			'read',
			subject('Content', { id: workshop.id }),
		)

		// Check if user is admin (can bypass all restrictions)
		const isAdmin = ability.can('create', 'Content')

		// Check if access is pending due to workshop not started yet
		const isPendingOpenAccess = ability.can('read', 'PendingOpenAccess')

		// Final decision: admin bypasses everything, others need actual content access
		const canViewContent = isAdmin || hasContentAccess

		return NextResponse.json(canViewContent, { headers: corsHeaders })
	} catch (error) {
		return NextResponse.json(false, { headers: corsHeaders })
	}
}

export const dynamic = 'force-dynamic'
