import { db } from '@/db'
import { describe, expect, it, vi } from 'vitest'

import { mockDb, resetMocks } from '../../test/mocks/db'
import {
	generateContentHash,
	NewPostSchema,
	PostSchema,
	PostUpdateSchema,
	updatePostSlug,
} from './posts'
import {
	createNewPostVersion,
	getLatestVersionNumber,
} from './posts-version-query'

vi.mock('@/db', () => ({
	db: mockDb,
}))

const now = new Date()
const basePost = PostSchema.parse({
	id: '123',
	type: 'post',
	fields: {
		title: 'Test Post',
		postType: 'lesson',
		state: 'draft',
		visibility: 'public',
		access: 'pro',
		slug: 'test-post~123',
	},
	createdById: 'user123',
	organizationId: 'org123',
	createdByOrganizationMembershipId: 'membership123',
	createdAt: now,
	updatedAt: now,
	deletedAt: null,
})

describe('Post Schemas', () => {
	describe('NewPostSchema', () => {
		it('validates required fields and title length', () => {
			expect(NewPostSchema.safeParse({}).success).toBe(false)
			expect(NewPostSchema.safeParse({ title: 'a' }).success).toBe(false)
			expect(NewPostSchema.safeParse({ title: 'a'.repeat(91) }).success).toBe(
				false,
			)
			expect(NewPostSchema.safeParse({ title: 'Valid Title' }).success).toBe(
				true,
			)
		})

		it('rejects empty or whitespace-only titles', () => {
			expect(NewPostSchema.safeParse({ title: '' }).success).toBe(false)
			expect(NewPostSchema.safeParse({ title: '   ' }).success).toBe(false)
		})
	})

	describe('PostUpdateSchema', () => {
		it('validates required fields and allows partial updates', () => {
			expect(PostUpdateSchema.safeParse({}).success).toBe(false)
			expect(
				PostUpdateSchema.safeParse({
					id: '123',
					fields: { title: 'Updated Title' },
				}).success,
			).toBe(true)
		})
	})
})

describe('Version Management', () => {
	beforeEach(() => {
		resetMocks()
	})

	it('creates new version with incremented version number', async () => {
		mockDb.query.contentResourceVersion.findFirst.mockResolvedValueOnce(null)
		const result = await createNewPostVersion(basePost, 'user456')
		expect(result?.currentVersionId).toMatch(/^version~/)
	})

	it('reuses existing version if content hash matches', async () => {
		const contentHash = generateContentHash(basePost)
		const existingVersionId = `version~${contentHash}`
		mockDb.query.contentResourceVersion.findFirst.mockResolvedValueOnce({
			id: existingVersionId,
			resourceId: basePost.id,
			versionNumber: 1,
			fields: basePost.fields,
			createdAt: now,
			createdById: 'user123',
		})

		const result = await createNewPostVersion(basePost)
		expect(result).toBeTruthy()
		expect(result?.currentVersionId).toBe(existingVersionId)
	})

	it('returns null for null post input', async () => {
		expect(await createNewPostVersion(null)).toBeNull()
	})

	describe('getLatestVersionNumber', () => {
		it('returns correct version number', async () => {
			mockDb.query.contentResourceVersion.findFirst.mockResolvedValueOnce(null)
			expect(await getLatestVersionNumber('123')).toBe(0)

			mockDb.query.contentResourceVersion.findFirst.mockResolvedValueOnce({
				versionNumber: 5,
				id: 'version~123',
				resourceId: '123',
				fields: {},
				createdAt: now,
				createdById: 'user123',
			})
			expect(await getLatestVersionNumber('123')).toBe(5)
		})
	})
})

describe('Content Management', () => {
	it('handles slug generation edge cases', () => {
		expect(
			updatePostSlug(basePost, 'Title with @#$%^&* special chars!'),
		).toMatch(/^title-with-and-special-chars~[a-z0-9-]+$/)

		const longTitle = 'a'.repeat(200)
		const longSlug = updatePostSlug(basePost, longTitle)
		expect(longSlug.split('~')).toHaveLength(2)
		expect(longSlug.length).toBeLessThan(200)
	})

	it('handles content hash generation', () => {
		const hash1 = generateContentHash(basePost)
		const postWithBody = PostSchema.parse({
			...basePost,
			fields: { ...basePost.fields, body: 'New content' },
		})
		expect(generateContentHash(postWithBody)).not.toBe(hash1)

		const postWithNulls = PostSchema.parse({
			...basePost,
			fields: { ...basePost.fields, body: null, description: null },
		})
		expect(generateContentHash(postWithNulls)).toBe(hash1)
	})
})
