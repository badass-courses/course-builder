'use server'

import { db } from '@/db'
import { contentResource, contentResourceTag } from '@/db/schema'
import { log } from '@/server/logger'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import z from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

const FeedItemSchema = ContentResourceSchema.extend({
	tags: z.any(),
})

export type FeedItem = z.infer<typeof FeedItemSchema>

export async function getFeed(): Promise<FeedItem[]> {
	const contentResources = await db.query.contentResource.findMany({
		where: and(
			eq(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				'public',
			),
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, 'published'),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTag.position),
			},
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
		limit: 9,
	})

	const parsedContentResources = z
		.array(FeedItemSchema)
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
