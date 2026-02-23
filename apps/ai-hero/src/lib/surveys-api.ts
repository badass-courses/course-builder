import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	questionResponse,
} from '@/db/schema'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import { Ability } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, count, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import {
	CreateSurveyApiInputSchema,
	DEFAULT_AFTER_COMPLETION_MESSAGES,
	SurveyWithQuestionsSchema,
	UpdateSurveyApiInputSchema,
	type CreateSurveyApiInput,
	type SurveyAnalytics,
	type SurveyRecentResponse,
	type SurveyWithQuestions,
	type UpdateSurveyApiInput,
} from './surveys'

export class SurveyApiError extends Error {
	constructor(
		message: string,
		public statusCode: number = 400,
		public details?: unknown,
	) {
		super(message)
	}
}

const requireAbility = (
	ability: Ability,
	action: 'read' | 'create' | 'update' | 'delete',
) => {
	if (!ability.can(action, 'Content')) {
		throw new SurveyApiError('Forbidden: Insufficient permissions', 403)
	}
}

const requireManageAll = (ability: Ability) => {
	if (!ability.can('manage', 'all')) {
		throw new SurveyApiError('Forbidden: Admin access required', 403)
	}
}

const parseSurvey = (survey: unknown): SurveyWithQuestions => {
	const parsed = SurveyWithQuestionsSchema.safeParse(survey)
	if (!parsed.success) {
		throw new SurveyApiError(
			'Failed to parse survey',
			500,
			parsed.error.format(),
		)
	}
	return parsed.data
}

export async function getSurveyForApi(
	slugOrId: string,
): Promise<SurveyWithQuestions> {
	const survey = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
			),
			eq(contentResource.type, 'survey'),
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	if (!survey) {
		throw new SurveyApiError('Survey not found', 404)
	}

	return parseSurvey(survey)
}

export async function listSurveysForApi({
	ability,
	search,
}: {
	ability: Ability
	search?: string
}): Promise<SurveyWithQuestions[]> {
	requireManageAll(ability)

	const searchTerm = search?.trim()
	const where = searchTerm
		? and(
				eq(contentResource.type, 'survey'),
				or(
					sql`JSON_UNQUOTE(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${searchTerm}%`}`,
					sql`JSON_UNQUOTE(JSON_EXTRACT(${contentResource.fields}, '$.slug')) LIKE ${`%${searchTerm}%`}`,
				),
			)
		: eq(contentResource.type, 'survey')

	const surveys = await db.query.contentResource.findMany({
		where,
		orderBy: (table, { desc }) => [desc(table.createdAt)],
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	const parsed = z.array(SurveyWithQuestionsSchema).safeParse(surveys)
	if (!parsed.success) {
		throw new SurveyApiError(
			'Failed to parse surveys',
			500,
			parsed.error.format(),
		)
	}

	return parsed.data
}

export async function createSurveyForApi({
	ability,
	userId,
	input,
}: {
	ability: Ability
	userId: string
	input: CreateSurveyApiInput
}): Promise<SurveyWithQuestions> {
	requireAbility(ability, 'create')

	const parsedInput = CreateSurveyApiInputSchema.safeParse(input)
	if (!parsedInput.success) {
		throw new SurveyApiError('Invalid input', 400, parsedInput.error.format())
	}

	const hash = guid()
	const surveySlug =
		parsedInput.data.slug || slugify(`${parsedInput.data.title}-${hash}`)
	const surveyId = `survey-${hash}`

	await db.insert(contentResource).values({
		id: surveyId,
		type: 'survey',
		createdById: userId,
		fields: {
			title: parsedInput.data.title,
			slug: surveySlug,
			state: parsedInput.data.state || 'draft',
			visibility: parsedInput.data.visibility || 'unlisted',
			afterCompletionMessages:
				parsedInput.data.afterCompletionMessages ||
				DEFAULT_AFTER_COMPLETION_MESSAGES,
		},
	})

	await log.info('api.survey.created', {
		surveyId,
		userId,
		slug: surveySlug,
	})

	revalidatePath('/admin/surveys')
	revalidatePath(`/admin/surveys/${surveySlug}`)
	revalidatePath(`/survey/${surveySlug}`)

	return getSurveyForApi(surveyId)
}

export async function updateSurveyForApi({
	ability,
	userId,
	input,
}: {
	ability: Ability
	userId: string
	input: UpdateSurveyApiInput
}): Promise<SurveyWithQuestions> {
	requireAbility(ability, 'update')

	const parsedInput = UpdateSurveyApiInputSchema.safeParse(input)
	if (!parsedInput.success) {
		throw new SurveyApiError('Invalid input', 400, parsedInput.error.format())
	}

	const existing = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, parsedInput.data.id),
			eq(contentResource.type, 'survey'),
		),
	})

	if (!existing) {
		throw new SurveyApiError('Survey not found', 404)
	}

	const existingFields = (existing.fields || {}) as Record<string, unknown>
	const updatedFields = {
		...existingFields,
		...(parsedInput.data.title !== undefined && {
			title: parsedInput.data.title,
		}),
		...(parsedInput.data.slug !== undefined && { slug: parsedInput.data.slug }),
		...(parsedInput.data.state !== undefined && {
			state: parsedInput.data.state,
		}),
		...(parsedInput.data.visibility !== undefined && {
			visibility: parsedInput.data.visibility,
		}),
		...(parsedInput.data.afterCompletionMessages !== undefined && {
			afterCompletionMessages: parsedInput.data.afterCompletionMessages,
		}),
	}

	await db
		.update(contentResource)
		.set({
			fields: updatedFields,
		})
		.where(eq(contentResource.id, parsedInput.data.id))

	await log.info('api.survey.updated', {
		surveyId: parsedInput.data.id,
		userId,
	})

	const oldSlug =
		typeof existingFields.slug === 'string'
			? (existingFields.slug as string)
			: null

	const updatedSurvey = await getSurveyForApi(parsedInput.data.id)
	const newSlug =
		typeof updatedSurvey.fields.slug === 'string'
			? updatedSurvey.fields.slug
			: null

	revalidatePath('/admin/surveys')
	revalidatePath(`/admin/surveys/${parsedInput.data.id}`)
	if (oldSlug) revalidatePath(`/admin/surveys/${oldSlug}`)
	if (newSlug) revalidatePath(`/admin/surveys/${newSlug}`)
	if (oldSlug) revalidatePath(`/survey/${oldSlug}`)
	if (newSlug) revalidatePath(`/survey/${newSlug}`)

	return updatedSurvey
}

export async function deleteSurveyForApi({
	ability,
	userId,
	surveyId,
}: {
	ability: Ability
	userId: string
	surveyId: string
}): Promise<{ success: true; surveyId: string }> {
	requireAbility(ability, 'delete')

	const existing = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, surveyId),
			eq(contentResource.type, 'survey'),
		),
	})

	if (!existing) {
		throw new SurveyApiError('Survey not found', 404)
	}

	const existingFields = (existing.fields || {}) as Record<string, unknown>
	const existingSlug =
		typeof existingFields.slug === 'string'
			? (existingFields.slug as string)
			: null

	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceOfId, surveyId))

	await db
		.delete(questionResponse)
		.where(eq(questionResponse.surveyId, surveyId))
	await db.delete(contentResource).where(eq(contentResource.id, surveyId))

	await log.info('api.survey.deleted', {
		surveyId,
		userId,
		slug: existingSlug,
	})

	revalidatePath('/admin/surveys')
	if (existingSlug) revalidatePath(`/admin/surveys/${existingSlug}`)
	if (existingSlug) revalidatePath(`/survey/${existingSlug}`)

	return { success: true, surveyId }
}

export async function getSurveyAnalyticsForApi({
	ability,
	slugOrId,
}: {
	ability: Ability
	slugOrId: string
}): Promise<SurveyAnalytics> {
	requireManageAll(ability)

	const survey = await getSurveyForApi(slugOrId)

	const [{ totalResponses = 0 } = { totalResponses: 0 }] = await db
		.select({ totalResponses: count() })
		.from(questionResponse)
		.where(eq(questionResponse.surveyId, survey.id))

	const [{ uniqueRespondents = 0 } = { uniqueRespondents: 0 }] = await db
		.select({
			uniqueRespondents:
				sql<number>`COUNT(DISTINCT COALESCE(${questionResponse.userId}, ${questionResponse.emailListSubscriberId}))`.as(
					'uniqueRespondents',
				),
		})
		.from(questionResponse)
		.where(eq(questionResponse.surveyId, survey.id))

	const responsesByDay = await db
		.select({
			date: sql<string>`DATE(${questionResponse.createdAt})`.as('date'),
			responses: count().as('responses'),
		})
		.from(questionResponse)
		.where(
			and(
				eq(questionResponse.surveyId, survey.id),
				sql`${questionResponse.createdAt} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
			),
		)
		.groupBy(sql`DATE(${questionResponse.createdAt})`)
		.orderBy(sql`DATE(${questionResponse.createdAt})`)

	const topQuestionRows = await db
		.select({
			questionId: questionResponse.questionId,
			responses: sql<number>`COUNT(*)`.as('responses'),
		})
		.from(questionResponse)
		.where(eq(questionResponse.surveyId, survey.id))
		.groupBy(questionResponse.questionId)
		.orderBy(sql`COUNT(*) DESC`)
		.limit(10)

	const questionById = new Map<
		string,
		{ slug: string | null; question: string; type: string | null }
	>()
	const questionBySlug = new Map<
		string,
		{ questionId: string; question: string; type: string | null }
	>()

	for (const relation of survey.resources || []) {
		if (relation.resource.type !== 'question') continue
		const fields = (relation.resource.fields || {}) as Record<string, unknown>
		const slug = typeof fields.slug === 'string' ? fields.slug : null
		const question =
			typeof fields.question === 'string'
				? fields.question
				: relation.resource.id
		const type = typeof fields.type === 'string' ? fields.type : null

		questionById.set(relation.resource.id, { slug, question, type })
		if (slug) {
			questionBySlug.set(slug, {
				questionId: relation.resource.id,
				question,
				type,
			})
		}
	}

	const topQuestions = topQuestionRows.map((row) => {
		const byId = questionById.get(row.questionId)
		const bySlug = questionBySlug.get(row.questionId)
		return {
			questionId: bySlug?.questionId || row.questionId,
			questionSlug: byId?.slug || (bySlug ? row.questionId : null),
			question: byId?.question || bySlug?.question || row.questionId,
			type: byId?.type || bySlug?.type || null,
			responses: Number(row.responses || 0),
		}
	})

	const recentResponsesRaw = await db.query.questionResponse.findMany({
		where: eq(questionResponse.surveyId, survey.id),
		with: {
			user: true,
			question: true,
		},
		orderBy: desc(questionResponse.createdAt),
		limit: 50,
	})

	const recentResponses: SurveyRecentResponse[] = recentResponsesRaw.map(
		(response) => {
			const fields = (response.fields || {}) as Record<string, unknown>
			const questionFields = (response.question?.fields || {}) as Record<
				string,
				unknown
			>
			const questionSlug =
				typeof questionFields.slug === 'string' ? questionFields.slug : null
			const question =
				typeof questionFields.question === 'string'
					? questionFields.question
					: questionSlug || response.questionId
			const answer =
				typeof fields.answer === 'string'
					? fields.answer
					: fields.answer === undefined || fields.answer === null
						? ''
						: String(fields.answer)

			return {
				id: response.id,
				questionId: response.questionId,
				questionSlug,
				question,
				answer,
				userId: response.userId || null,
				userEmail: response.user?.email || null,
				emailListSubscriberId: response.emailListSubscriberId || null,
				createdAt: response.createdAt,
			}
		},
	)

	const surveyFields = survey.fields as Record<string, unknown>
	return {
		surveyId: survey.id,
		surveySlug:
			typeof surveyFields.slug === 'string'
				? (surveyFields.slug as string)
				: survey.id,
		surveyTitle:
			typeof surveyFields.title === 'string'
				? (surveyFields.title as string)
				: 'Untitled Survey',
		totalResponses: Number(totalResponses),
		uniqueRespondents: Number(uniqueRespondents),
		responsesByDay: responsesByDay.map((row) => ({
			date: row.date,
			responses: Number(row.responses),
		})),
		topQuestions,
		recentResponses,
	}
}
