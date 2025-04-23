'use server'

import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

import { RESOURCE_CREATED_EVENT } from '../../inngest/events/resource-management'
import { inngest } from '../../inngest/inngest.server'
import { upsertPostToTypeSense } from '../typesense-query'

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

	try {
		console.log(
			`Dispatching ${RESOURCE_CREATED_EVENT} for resource: ${parsedResource.data.id} (type: ${parsedResource.data.type})`,
		)
		await inngest.send({
			name: RESOURCE_CREATED_EVENT,
			data: {
				id: parsedResource.data.id,
				type: parsedResource.data.type,
			},
		})
	} catch (error) {
		console.error(`Error dispatching ${RESOURCE_CREATED_EVENT}`, error)
	}

	await upsertPostToTypeSense(parsedResource.data, 'save')
	return parsedResource.data
}
