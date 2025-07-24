import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'

export async function getTips({ userId }: { userId: string }) {
	return db
		.select()
		.from(contentResource)
		.where(
			and(
				eq(contentResource.type, 'tip'),
				eq(contentResource.createdById, userId),
			),
		)
		.orderBy(desc(contentResource.updatedAt))
}
