'use server'

import { revalidatePath } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import {
	NewWorkshopInputSchema,
	WorkshopSchema,
	type Workshop,
} from '@/lib/workshops'
import { WorkshopError } from '@/lib/workshops/errors'
import { getServerAuthSession } from '@/server/auth'
import { Ability, subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'

import { guid } from '@coursebuilder/utils-core/guid'

export async function getWorkshop(slugOrId: string, ability: Ability) {
	console.log('🔍 Querying workshop with slugOrId:', slugOrId)

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public', 'unlisted']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const workshop = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
				eq(contentResource.id, `workshop_${slugOrId.split('~')[1]}`),
			),
			eq(contentResource.type, 'workshop'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: {
										with: {
											resources: {
												with: {
													resource: true,
												},
												orderBy: asc(contentResourceResource.position),
											},
										},
									},
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	if (!workshop) {
		console.log('❌ No workshop found for slugOrId:', slugOrId)
		return null
	}

	const workshopParsed = WorkshopSchema.safeParse(workshop)
	if (!workshopParsed.success) {
		console.error('❌ Error parsing workshop:', workshopParsed.error)
		throw new WorkshopError(
			'Invalid workshop data in database',
			500,
			workshopParsed.error,
		)
	}

	console.log('✅ Workshop found:', workshopParsed.data.id)
	return workshopParsed.data
}

export async function getWorkshopById({
	id,
	ability,
}: {
	id: string
	ability: Ability
}) {
	console.log('🔍 Getting workshop by ID:', id)
	const workshop = await getWorkshop(id, ability)

	if (!workshop) {
		console.log('❌ Workshop not found:', id)
		throw new WorkshopError('Workshop not found', 404)
	}

	if (ability.cannot('read', subject('Content', workshop))) {
		console.log('❌ User lacks permission to read workshop:', id)
		throw new WorkshopError('Unauthorized', 401)
	}

	console.log('✅ Workshop retrieved:', workshop)
	return workshop
}

export async function createWorkshop(input: {
	title: string
	subtitle?: string
	description?: string
	timezone?: string
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || ability.cannot('create', 'Content')) {
		throw new WorkshopError('Unauthorized', 401)
	}

	const validatedData = NewWorkshopInputSchema.safeParse({
		...input,
		createdById: user.id,
	})

	if (!validatedData.success) {
		throw new WorkshopError('Invalid input', 400, validatedData.error)
	}

	try {
		return await writeNewWorkshopToDatabase({
			title: validatedData.data.title,
			subtitle: validatedData.data.subtitle,
			description: validatedData.data.description,
			timezone: validatedData.data.timezone,
			createdById: user.id,
		})
	} catch (error) {
		throw new WorkshopError('Failed to create workshop', 500, error)
	}
}

export async function getWorkshops({
	userId,
	ability,
	slug,
}: {
	userId?: string
	ability: Ability
	slug?: string | null
}) {
	if (slug) {
		console.log('🔍 Getting workshop by slug:', slug)
		const workshop = await getWorkshop(slug, ability)

		if (!workshop) {
			console.log('❌ Workshop not found:', slug)
			throw new WorkshopError('Workshop not found', 404)
		}

		if (ability.cannot('read', subject('Content', workshop))) {
			console.log('❌ User lacks permission to read workshop:', slug)
			throw new WorkshopError('Unauthorized', 401)
		}

		console.log('✅ Workshop retrieved:', workshop.id)
		return workshop
	}

	if (ability.cannot('read', 'Content')) {
		throw new WorkshopError('Unauthorized', 401)
	}

	return getAllWorkshopsForUser(userId)
}

export async function updateWorkshop(input: {
	id: string
	fields: Workshop['fields']
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || ability.cannot('update', 'Content')) {
		throw new WorkshopError('Unauthorized', 401)
	}

	const originalWorkshop = await getWorkshop(input.id, ability)
	if (!originalWorkshop) {
		throw new WorkshopError('Workshop not found', 404)
	}

	if (ability.cannot('manage', subject('Content', originalWorkshop))) {
		throw new WorkshopError('Unauthorized', 401)
	}

	try {
		const result = await courseBuilderAdapter.updateContentResourceFields({
			id: originalWorkshop.id,
			fields: {
				...originalWorkshop.fields,
				...input.fields,
			},
		})

		if (!result || !result.fields) {
			throw new WorkshopError('Failed to update workshop', 500)
		}

		revalidatePath(`/workshops/${result.fields.slug}`)
		revalidatePath(`/workshops/${result.fields.slug}/edit`)

		return result
	} catch (error: any) {
		throw new WorkshopError('Failed to update workshop', 500, error)
	}
}

export async function deleteWorkshop({
	id,
	ability,
}: {
	id: string
	ability: Ability
}) {
	if (!id) {
		throw new WorkshopError('Missing workshop ID', 400)
	}

	const workshopToDelete = await courseBuilderAdapter.getContentResource(id)
	if (!workshopToDelete) {
		throw new WorkshopError('Workshop not found', 404)
	}

	if (ability.cannot('delete', subject('Content', workshopToDelete))) {
		throw new WorkshopError('Unauthorized', 401)
	}

	try {
		await deleteWorkshopFromDatabase(id)

		console.log(
			'🔄 Revalidating path:',
			`/workshops/${workshopToDelete.fields?.slug}`,
		)
		revalidatePath(`/workshops/${workshopToDelete.fields?.slug}`)

		return { message: 'Workshop deleted successfully' }
	} catch (error) {
		throw new WorkshopError('Failed to delete workshop', 500, error)
	}
}

export async function getAllWorkshops(): Promise<Workshop[]> {
	try {
		const workshops = await db.query.contentResource.findMany({
			where: eq(contentResource.type, 'workshop'),
			orderBy: desc(contentResource.createdAt),
		})

		const workshopsParsed = WorkshopSchema.array().safeParse(workshops)
		if (!workshopsParsed.success) {
			console.error('Error parsing workshops', workshopsParsed.error)
			return []
		}

		return workshopsParsed.data
	} catch (error) {
		console.error('Error fetching workshops', error)
		return []
	}
}

export async function getAllWorkshopsForUser(
	userId?: string,
): Promise<Workshop[]> {
	if (!userId) {
		return []
	}

	const workshops = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'workshop'),
			eq(contentResource.createdById, userId),
		),
		orderBy: desc(contentResource.createdAt),
	})

	const workshopsParsed = WorkshopSchema.array().safeParse(workshops)
	if (!workshopsParsed.success) {
		console.error('Error parsing workshops', workshopsParsed.error)
		return []
	}

	return workshopsParsed.data
}

export async function writeNewWorkshopToDatabase({
	title,
	subtitle,
	description,
	timezone = 'America/Los_Angeles',
	createdById,
}: {
	title: string
	subtitle?: string
	description?: string
	timezone?: string
	createdById: string
}): Promise<Workshop> {
	const workshopGuid = guid()
	const newWorkshopId = `workshop_${workshopGuid}`

	const workshopValues = {
		id: newWorkshopId,
		type: 'workshop',
		createdById,
		fields: {
			title,
			subtitle,
			description,
			timezone,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${title}~${workshopGuid}`),
		},
	}

	try {
		await db.insert(contentResource).values(workshopValues as any)
		console.log('✅ Workshop inserted into database:', newWorkshopId)
	} catch (error) {
		console.error('❌ Error inserting workshop:', error)
		throw error
	}

	const workshop = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, newWorkshopId),
	})

	if (!workshop) {
		throw new Error('Workshop not found after creation')
	}

	const workshopParsed = WorkshopSchema.safeParse(workshop)
	if (!workshopParsed.success) {
		console.error('❌ Error parsing workshop:', workshopParsed.error)
		throw new Error('Invalid workshop data')
	}

	return workshopParsed.data
}

async function deleteWorkshopFromDatabase(id: string) {
	console.log('🗑️ Deleting workshop from database:', id)

	const workshop = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, id),
			eq(contentResource.type, 'workshop'),
		),
	})

	if (!workshop) {
		throw new Error(`Workshop with id ${id} not found`)
	}

	await db.delete(contentResource).where(eq(contentResource.id, id))

	console.log('✅ Workshop deleted:', id)
	return true
}
