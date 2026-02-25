import { NextRequest, NextResponse } from 'next/server'
import { getSurveyAnalyticsForApi, SurveyApiError } from '@/lib/surveys-api'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'
import { withSkill } from '@/server/with-skill'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET /api/surveys/analytics?slugOrId=<survey-id-or-slug>
 * Returns aggregate survey analytics.
 */
const getSurveyAnalyticsHandler = async (request: NextRequest) => {
	const { searchParams } = new URL(request.url)
	const slugOrId = searchParams.get('slugOrId')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!slugOrId) {
			return NextResponse.json(
				{ error: 'slugOrId is required' },
				{ status: 400, headers: corsHeaders },
			)
		}

		const analytics = await getSurveyAnalyticsForApi({
			ability,
			slugOrId,
		})

		return NextResponse.json(analytics, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof SurveyApiError) {
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}

		await log.error('api.surveys.analytics.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			slugOrId,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
export const GET = withSkill(getSurveyAnalyticsHandler)
