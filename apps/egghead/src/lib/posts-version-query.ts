import { db } from '@/db'
import {
	contentResource,
	contentResourceVersion as contentResourceVersionTable,
} from '@/db/schema'
import { Post } from '@/lib/posts'
import { desc, eq } from 'drizzle-orm'

import { generateContentHash } from './posts'

export async function createNewPostVersion(
	post: Post | null,
	createdById?: string,
) {
	if (!post) return null
	const contentHash = generateContentHash(post)
	const versionId = `version~${contentHash}`

	// Check if this version already exists
	const existingVersion = await db.query.contentResourceVersion.findFirst({
		where: eq(contentResourceVersionTable.id, versionId),
	})

	if (existingVersion) {
		// If this exact version already exists, just update the current version pointer
		await db
			.update(contentResource)
			.set({ currentVersionId: versionId })
			.where(eq(contentResource.id, post.id))
		return post
	}

	// If it's a new version, create it
	await db.transaction(async (trx) => {
		await trx.insert(contentResourceVersionTable).values({
			id: versionId,
			resourceId: post.id,
			parentVersionId: post.currentVersionId,
			versionNumber: (await getLatestVersionNumber(post.id)) + 1,
			fields: {
				...post.fields,
			},
			createdAt: new Date(),
			createdById: createdById ? createdById : post.createdById,
		})

		post.currentVersionId = versionId

		await trx
			.update(contentResource)
			.set({ currentVersionId: versionId })
			.where(eq(contentResource.id, post.id))
	})
	return post
}

export async function getLatestVersionNumber(postId: string): Promise<number> {
	const latestVersion = await db.query.contentResourceVersion.findFirst({
		where: eq(contentResourceVersionTable.resourceId, postId),
		orderBy: desc(contentResourceVersionTable.versionNumber),
	})
	return latestVersion ? latestVersion.versionNumber : 0
}
