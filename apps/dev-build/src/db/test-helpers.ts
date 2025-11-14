import { eq } from 'drizzle-orm'

import { type TestDb } from './test-db'
import { testPosts } from './test-schema'

export type TestPost = typeof testPosts.$inferInsert

export async function createTestPost(
	db: TestDb,
	overrides: Partial<TestPost> = {},
) {
	const now = new Date().toISOString()
	const post: TestPost = {
		id: `test-${Math.random().toString(36).slice(2)}`,
		title: 'Test Post',
		state: 'draft',
		visibility: 'public',
		postType: 'article',
		createdById: 'user-1',
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
		parentLessonId: null,
		...overrides,
	}

	await db.insert(testPosts).values(post)
	return post
}

export async function findTestPost(db: TestDb, id: string) {
	const [post] = await db.select().from(testPosts).where(eq(testPosts.id, id))
	return post
}

export async function clearTestPosts(db: TestDb) {
	await db.delete(testPosts)
}
