'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { log } from '@/server/logger'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import z from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

export async function getFeed() {
	const contentResources = await db.query.contentResource.findMany({
		where: and(
			eq(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				'public',
			),
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, 'published'),
		),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: true,
								},
							},
						},
					},
				},
			},
		},
		orderBy: desc(contentResource.createdAt),
		limit: 10,
	})

	const parsedContentResources = z
		.array(ContentResourceSchema)
		.safeParse(contentResources)

	if (!parsedContentResources.success) {
		await log.error('feed.parse.failed', {
			error: parsedContentResources.error.format(),
		})
		return []
	}

	await log.info('feed.fetch.success', {
		count: parsedContentResources.data.length,
	})

	return parsedContentResources.data
}
