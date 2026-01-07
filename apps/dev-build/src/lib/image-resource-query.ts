'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { IMAGE_RESOURCE_CREATED_EVENT } from '@/inngest/events/image-resource-created'
import { inngest } from '@/inngest/inngest.server'
import { getServerAuthSession } from '@/server/auth'
import { sql } from 'drizzle-orm'
import { z } from 'zod'

const ImageResourceSchema = z.object({
	id: z.string(),
	url: z.string(),
	alt: z.string().optional().nullable(),
})

export async function createImageResource(input: {
	asset_id: string
	secure_url: string
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	await db
		.insert(contentResource)
		.values({
			id: input.asset_id,
			type: 'imageResource',
			fields: {
				state: 'ready',
				url: input.secure_url,
			},
			createdById: user.id,
		})
		.then((result) => {
			return result
		})
		.catch((error) => {
			console.error(error)
			throw error
		})

	await inngest.send({
		name: IMAGE_RESOURCE_CREATED_EVENT,
		data: {
			resourceId: input.asset_id,
		},
		user,
	})
}

export async function getAllImageResources() {
	const query = sql`
      SELECT    
        id as id,
        JSON_EXTRACT (${contentResource.fields}, "$.url") AS url,
        JSON_EXTRACT (${contentResource.fields}, "$.alt") AS alt
      FROM
        ${contentResource}
      WHERE
        type = 'imageResource'
      ORDER BY
        createdAt DESC
    `
	return db.execute(query).then((result) => {
		const parsed = z.array(ImageResourceSchema).safeParse(result.rows)
		return parsed.success ? parsed.data : []
	})
}
