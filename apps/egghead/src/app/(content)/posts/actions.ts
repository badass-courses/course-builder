'use server'

import { db } from '@/db'
import { contentResourceResource } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export async function removePostFromCoursePost({
	postId,
	resourceOfId,
}: {
	postId: string
	resourceOfId: string
}) {
	return await db
		.delete(contentResourceResource)
		.where(
			and(
				eq(contentResourceResource.resourceOfId, resourceOfId),
				eq(contentResourceResource.resourceId, postId),
			),
		)
}
