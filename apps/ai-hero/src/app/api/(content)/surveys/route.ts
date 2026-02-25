import { NextRequest, NextResponse } from 'next/server'
import {
	createSurveyForApi,
	deleteSurveyForApi,
	getSurveyForApi,
	listSurveysForApi,
	SurveyApiError,
	updateSurveyForApi,
} from '@/lib/surveys-api'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'
import { withSkill } from '@/server/with-skill'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET /api/surveys
 * - /api/surveys?slugOrId=<id-or-slug> returns a single survey
 * - /api/surveys?search=<query> returns all surveys filtered by search
 */
const getSurveysHandler = async (request: NextRequest) => {
	const { searchParams } = new URL(request.url)
	const slugOrId = searchParams.get('slugOrId')
	const search = searchParams.get('search')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}
		if (!ability.can('manage', 'all')) {
			return NextResponse.json(
				{ error: 'Forbidden: Admin access required' },
				{ status: 403, headers: corsHeaders },
			)
		}

		if (slugOrId) {
			const survey = await getSurveyForApi(slugOrId)
			return NextResponse.json(survey, { headers: corsHeaders })
		}

		const surveys = await listSurveysForApi({
			ability,
			search: search ?? undefined,
		})
		return NextResponse.json(surveys, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof SurveyApiError) {
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}

		await log.error('api.surveys.get.failed', {
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
export const GET = withSkill(getSurveysHandler)

/**
 * POST /api/surveys
 * Creates a new survey.
 */
const createSurveyHandler = async (request: NextRequest) => {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		const body = await request.json()
		const survey = await createSurveyForApi({
			ability,
			userId: user.id,
			input: body,
		})

		return NextResponse.json(survey, { status: 201, headers: corsHeaders })
	} catch (error) {
		if (error instanceof SurveyApiError) {
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}

		await log.error('api.surveys.post.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
export const POST = withSkill(createSurveyHandler)

/**
 * PATCH /api/surveys
 * Updates an existing survey.
 */
const updateSurveyHandler = async (request: NextRequest) => {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		const body = await request.json()
		const survey = await updateSurveyForApi({
			ability,
			userId: user.id,
			input: body,
		})

		return NextResponse.json(survey, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof SurveyApiError) {
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}

		await log.error('api.surveys.patch.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
export const PATCH = withSkill(updateSurveyHandler)

/**
 * DELETE /api/surveys?id=<survey-id>
 * Deletes a survey and related records.
 */
const deleteSurveyHandler = async (request: NextRequest) => {
	const { searchParams } = new URL(request.url)
	const id = searchParams.get('id')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!id) {
			return NextResponse.json(
				{ error: 'ID is required' },
				{ status: 400, headers: corsHeaders },
			)
		}

		const result = await deleteSurveyForApi({
			ability,
			userId: user.id,
			surveyId: id,
		})

		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof SurveyApiError) {
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}

		await log.error('api.surveys.delete.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			id,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
export const DELETE = withSkill(deleteSurveyHandler)
