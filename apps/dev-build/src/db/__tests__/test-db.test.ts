import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { createTestDb } from '../test-db'
import { testPosts } from '../test-schema'

describe('SQLite Test DB', () => {
	it('can create and query posts', async () => {
		const { db, cleanup } = createTestDb()

		const testPost = {
			id: 'test-1',
			title: 'Test Post',
			state: 'draft',
			visibility: 'public',
			postType: 'article',
			createdById: 'user-1',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			deletedAt: null,
			parentLessonId: null,
		}

		// Insert test data
		await db.insert(testPosts).values(testPost)

		// Query the data back
		const result = await db
			.select()
			.from(testPosts)
			.where(eq(testPosts.id, 'test-1'))

		expect(result[0]).toEqual(testPost)

		cleanup()
	})
})
