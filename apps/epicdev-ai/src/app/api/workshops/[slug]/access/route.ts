import { NextRequest, NextResponse } from 'next/server'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { getWorkshop } from '@/lib/workshops-query'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { subject } from '@casl/ability'
import { formatInTimeZone } from 'date-fns-tz'

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

		// Check basic content access
		const hasContentAccess = ability.can(
			'read',
			subject('Content', { id: workshop.id }),
		)

		// Check if user is admin (can bypass date restrictions)
		const isAdmin = ability.can('create', 'Content')

		// Check if workshop has started (for non-admin users)
		let workshopHasStarted = true

		if (!isAdmin && workshop.fields?.startsAt) {
			const timezone = workshop.fields?.timezone || 'America/Los_Angeles'
			const nowInTZ = new Date(
				formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
			)
			const startsAtDate = new Date(workshop.fields.startsAt)
			workshopHasStarted = startsAtDate <= nowInTZ
		}

		// Final decision: admin bypasses everything, others need content access + started
		const canViewContent = isAdmin || (hasContentAccess && workshopHasStarted)

		return NextResponse.json(canViewContent, { headers: corsHeaders })
	} catch (error) {
		return NextResponse.json(false, { headers: corsHeaders })
	}
}

export const dynamic = 'force-dynamic'
