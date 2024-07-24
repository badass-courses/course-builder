'use server'

import { courseBuilderAdapter, db } from '@/db'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contributionTypes,
} from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

const NewResourceSchema = z.object({
	type: z.string(),
	title: z.string().min(2).max(90),
})

type NewResource = z.infer<typeof NewResourceSchema>

export async function createResource(input: NewResource) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const hash = guid()
	const newResourceId = slugify(`${input.type}~${hash}`)

	const newResource = {
		id: newResourceId,
		type: input.type,
		fields: {
			title: input.title,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.title}~${hash}`),
		},
		createdById: user.id,
	}

	await db.insert(contentResource).values(newResource)

	const resource = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, newResourceId),
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
	})

	const parsedResource = ContentResourceSchema.safeParse(resource)
	if (!parsedResource.success) {
		console.error('Error parsing resource', resource)
		throw new Error('Error parsing resource')
	}
	return parsedResource.data
}

const NewResourceWithVideoSchema = z.object({
	title: z.string().min(2).max(90),
	videoResourceId: z.string().min(4, 'Please upload a video').optional(),
	type: z.string().optional(),
})

type NewResourceWithVideo = z.infer<typeof NewResourceWithVideoSchema>

export async function createResourceWithVideo(input: NewResourceWithVideo) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const hash = guid()
	const newResourceId = slugify(`${input.type}~${hash}`)
	if (input.videoResourceId) {
		const videoResource = await courseBuilderAdapter.getVideoResource(
			input.videoResourceId,
		)

		if (!videoResource) {
			throw new Error('🚨 Video Resource not found')
		}
	}
	const newResource = {
		id: newResourceId,
		type: input.type || 'lesson',
		fields: {
			title: input.title,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.title}~${hash}`),
		},
		createdById: user.id,
	}

	await db.insert(contentResource).values(newResource)

	const resource = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, newResourceId),
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
	})

	if (resource && input.videoResourceId) {
		await db
			.insert(contentResourceResource)
			.values({ resourceOfId: resource.id, resourceId: input.videoResourceId })

		const contributionType = await db.query.contributionTypes.findFirst({
			where: eq(contributionTypes.slug, 'author'),
		})

		if (contributionType) {
			await db.insert(contentContributions).values({
				id: `cc-${guid()}`,
				userId: user.id,
				contentId: resource.id,
				contributionTypeId: contributionType.id,
			})
		}
	}

	const parsedResource = ContentResourceSchema.safeParse(resource)
	if (!parsedResource.success) {
		console.error('Error parsing resource', resource)
		throw new Error('Error parsing resource')
	}
	return parsedResource.data
}

export async function removeResource(
	resourceId: string,
	pathToRevalidate: string,
) {
	await db.delete(contentResource).where(eq(contentResource.id, resourceId))
	return await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceId, resourceId))
}
