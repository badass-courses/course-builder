import { ImageResponse } from 'next/og'
import Background from '@/components/certificates/background'
import Logo from '@/components/certificates/logo'
import Signature from '@/components/certificates/signature'
import { db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	resourceProgress,
	users,
} from '@/db/schema'
import { WorkshopSchema } from '@/lib/workshops'
import { format } from 'date-fns'
import { and, asc, eq, or, sql } from 'drizzle-orm'

export const runtime = 'edge'
export const revalidate = 60
// export const contentType = 'image/png'

/**
 * Edge-safe helper to check if user completed all lessons in a resource
 */
async function hasUserCompletedAllLessons(
	userId: string,
	resourceId: string,
): Promise<{ completed: boolean; lastCompletedDate: Date | null }> {
	// Execute the optimized query to check if there are any incomplete lessons
	const results: any = await db.execute(sql`
	SELECT
		COUNT(CASE WHEN rp.completedAt IS NULL THEN 1 END) AS incomplete_lessons,
		MAX(rp.completedAt) AS last_completed_date
	FROM ${contentResource} cr
	LEFT JOIN ${resourceProgress} rp ON rp.resourceId = cr.id AND rp.userId = ${userId}
	WHERE cr.id IN (
			SELECT cr.id
			FROM ${contentResource} cr
			WHERE cr.id IN (
					SELECT crr.resourceId
					FROM ${contentResourceResource} crr
					WHERE crr.resourceOfId = (
							SELECT id
							FROM ${contentResource}
							WHERE id = ${resourceId} OR fields->>'$.slug' = ${resourceId}
					)
			)
			OR cr.id IN (
					SELECT crr.resourceId
					FROM ${contentResourceResource} crr
					WHERE crr.resourceOfId IN (
							SELECT crr.resourceId
							FROM ${contentResourceResource} crr
							WHERE crr.resourceOfId = (
									SELECT id
									FROM ${contentResource}
									WHERE id = ${resourceId} OR fields->>'$.slug' = ${resourceId}
							)
					)
			)
	)
	AND cr.type IN ('lesson', 'exercise')
	AND (cr.fields->>'$.optional' IS NULL OR cr.fields->>'$.optional' = 'false')
`)

	const incompleteLessons = Number(results.rows[0]?.incomplete_lessons) || 0
	const lastCompletedDate = results.rows[0]?.last_completed_date
		? new Date(results.rows[0].last_completed_date)
		: null

	// If there are no incomplete lessons, the user has completed all lessons
	const completed = incompleteLessons === 0

	return { completed, lastCompletedDate }
}

/**
 * Edge-safe helper to get all workshops in a cohort
 */
async function getAllWorkshopsInCohort(cohortId: string) {
	try {
		const results = await db
			.select()
			.from(contentResourceResource)
			.innerJoin(
				contentResource,
				eq(contentResource.id, contentResourceResource.resourceId),
			)
			.where(
				and(
					eq(contentResource.type, 'workshop'),
					eq(contentResourceResource.resourceOfId, cohortId),
				),
			)
			.orderBy(asc(contentResourceResource.position))

		return results.map((r) => {
			const parsed = WorkshopSchema.safeParse(r.ContentResource)
			if (!parsed.success) {
				console.error(
					'Failed to parse workshop:',
					parsed.error,
					r.ContentResource,
				)
				throw new Error(`Invalid workshop data for cohort ${cohortId}`)
			}
			return parsed.data
		})
	} catch (error) {
		console.error('Failed to get workshops in cohort:', error)
		throw error
	}
}

/**
 * Edge-safe helper to check certificate eligibility for a workshop
 */
async function checkCertificateEligibility(resourceId: string, userId: string) {
	if (!userId) {
		return { hasCompletedModule: false }
	}

	const { completed: hasCompletedModule, lastCompletedDate } =
		await hasUserCompletedAllLessons(userId, resourceId)

	return { hasCompletedModule, date: lastCompletedDate }
}

/**
 * Edge-safe helper to check certificate eligibility for a cohort
 */
async function checkCohortCertificateEligibility(
	cohortId: string,
	userId?: string,
) {
	if (!userId) {
		return { hasCompletedCohort: false, date: null }
	}
	try {
		const modules = await getAllWorkshopsInCohort(cohortId)

		if (!modules || modules.length === 0) {
			return { hasCompletedCohort: false, date: null }
		}

		const moduleCompletionPromises = modules.map((module) =>
			hasUserCompletedAllLessons(userId, module.id),
		)

		const moduleCompletionResults = await Promise.all(moduleCompletionPromises)
		const allModulesCompleted = moduleCompletionResults.every(
			(result) => result.completed,
		)

		if (!allModulesCompleted) {
			return { hasCompletedCohort: false, date: null }
		}

		const completionDates = moduleCompletionResults
			.map((result) => result.lastCompletedDate)
			.filter((date): date is Date => date !== null)

		let latestCompletionDate: Date | null = null
		if (completionDates.length > 0) {
			latestCompletionDate = new Date(
				Math.max(...completionDates.map((date) => date.getTime())),
			)
		}

		return {
			hasCompletedCohort: allModulesCompleted,
			date: latestCompletionDate,
		}
	} catch (error) {
		console.error(error)
		return { hasCompletedCohort: false, date: null }
	}
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)

		const hasResource = searchParams.has('resource')
		const resourceSlugOrID = hasResource ? searchParams.get('resource') : null
		if (!resourceSlugOrID) {
			return new Response(JSON.stringify({ error: 'Missing resource' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}
		const hasUser = searchParams.has('user')
		const userId = hasUser ? searchParams.get('user') : null

		if (!userId) {
			return new Response(JSON.stringify({ error: 'Missing user' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const resource = await db.query.contentResource.findFirst({
			where: and(
				or(
					eq(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
						resourceSlugOrID,
					),
					eq(contentResource.id, resourceSlugOrID),
				),
			),
		})

		if (!resource) {
			return new Response(JSON.stringify({ error: 'Resource not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		let isEligible = false
		let completedAt: Date | null | undefined = null

		if (resource.type === 'cohort') {
			const { hasCompletedCohort, date } =
				await checkCohortCertificateEligibility(resource.id, userId)
			isEligible = hasCompletedCohort
			completedAt = date
		} else {
			const { hasCompletedModule, date } = await checkCertificateEligibility(
				resourceSlugOrID,
				userId,
			)
			isEligible = hasCompletedModule
			completedAt = date
		}

		if (!isEligible) {
			return new Response(
				JSON.stringify({ error: 'Not eligible for certificate' }),
				{
					status: 422,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		const user = await db.query.users.findFirst({
			where: or(eq(users.id, userId), eq(users.email, userId)),
		})

		if (!user) {
			return new Response(JSON.stringify({ error: 'User not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const fontData = await fetch(
			new URL(
				'../../../../public/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full items-center justify-center bg-black flex-col"
					style={{
						fontFamily: 'Maison',
						background: 'linear-gradient(105deg, #FFF 0.91%, #F7F7F9 100%)',
						lineHeight: 1,
						width: 842 * 2,
						height: 595 * 2,
					}}
				>
					<div tw="absolute flex items-center justify-center left-0 top-0 w-full h-full">
						<Background />
					</div>
					<div tw="flex flex-col items-center leading-none text-center justify-center w-full">
						{/* <img
							src={resource?.fields?.coverImage.url}
							width={500}
							height={500}
						/> */}
						<h1
							style={{
								fontSize: 75,
								lineHeight: 0.2,
								color: '#fff',
							}}
							className="font-bold text-white"
						>
							Certificate of Completion
						</h1>
						<div
							style={{
								fontSize: 50,
								maxWidth: 700,
							}}
							tw="flex mt-24 border-b-2 border-gray-500 pb-4 w-full flex-col items-center justify-center text-center text-white"
						>
							{user.name}
						</div>
						<div
							style={{
								fontSize: 24,
								maxWidth: 700,
								lineHeight: 1.3,
							}}
							tw="flex mt-10 w-full flex-col items-center justify-center text-center text-white"
						>
							Has Successfully Completed the {resource?.fields?.title}{' '}
							{resource.type === 'cohort' ? 'Cohort' : 'Workshop'}.
						</div>
					</div>
					<div tw="absolute flex items-center justify-center left-32 bottom-32">
						<Logo />
					</div>
					<div tw="absolute flex items-center justify-center bottom-24 text-white">
						<Signature />
					</div>
					<div tw="absolute flex items-center text-xl justify-center bottom-32 right-32 text-white">
						{completedAt && `${format(completedAt, 'MMMM do, y')}`}
					</div>
				</div>
			),
			{
				width: 842 * 2,
				height: 595 * 2,
				fonts: [
					{
						name: 'Maison',
						data: fontData,
						style: 'normal',
					},
				],
			},
		)
	} catch (e: any) {
		return new Response('Failed to generate certificate', { status: 500 })
	}
}
