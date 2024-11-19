'use server'

import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'

import type { VideoResource } from '@coursebuilder/core/schemas'

export async function getVideoResource(id: string | null | undefined) {
	return courseBuilderAdapter.getVideoResource(id)
}

export async function getResourceOfVideoResource(
	videoResourceId: VideoResource['id'],
) {
	const lessonVideoContentResourceResource =
		await db.query.contentResourceResource.findFirst({
			where: eq(contentResourceResource.resourceId, videoResourceId),
		})

	return await db.query.contentResource.findFirst({
		where: and(
			eq(
				contentResource.id,
				lessonVideoContentResourceResource?.resourceOfId || '',
			),
			eq(contentResource.type, 'post'),
		),
		orderBy: desc(contentResource.createdAt),
	})
}
