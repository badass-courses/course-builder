/**
 * Query configuration for epic-web app.
 * Centralizes auth, logging, and search indexing settings for query utilities.
 */
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'

import {
	createSearchConfig,
	type AuthConfig,
	type AuthLogger,
	type SearchAction,
	type SearchLogger,
} from '@coursebuilder/next/query'

import type { Lesson } from './lessons'
import type { Post } from './posts'
import { deletePostInTypeSense, upsertPostToTypeSense } from './typesense-query'

// Create a logger wrapper that matches the expected interface
const authLogger: AuthLogger = {
	error: (event, data) => log.error(event, data ?? {}),
	info: (event, data) => log.info(event, data ?? {}),
}

const searchLogger: SearchLogger = {
	error: (event, data) => log.error(event, data ?? {}),
	info: (event, data) => log.info(event, data ?? {}),
}

/**
 * Auth configuration for epic-web.
 * Use with withAuthorization, withResourceAuthorization, requireAuth.
 */
export const authConfig: AuthConfig = {
	getAuth: async () => {
		const result = await getServerAuthSession()
		return {
			session: result.session,
			ability: {
				can: (action: string, subject: unknown, field?: string) =>
					result.ability.can(action as any, subject as any, field),
			},
		}
	},
	logger: authLogger,
}

/**
 * Search indexing configuration for posts.
 * Use with indexDocument, withSearchIndexing, createIndexedMutation.
 */
export const postSearchConfig = createSearchConfig<Post>({
	upsert: async (post: Post, action: SearchAction) => {
		// TypeSense upsert doesn't handle 'delete' action
		if (action !== 'delete') {
			await upsertPostToTypeSense(post, action)
		}
	},
	delete: async (postId: string) => {
		await deletePostInTypeSense(postId)
	},
	logger: searchLogger,
	eventPrefix: 'post',
})

/**
 * Search indexing configuration for lessons.
 * Uses the same TypeSense functions as posts (lessons are indexed in the same collection).
 */
export const lessonSearchConfig = createSearchConfig<Lesson>({
	upsert: async (lesson: Lesson, action: SearchAction) => {
		// TypeSense upsert doesn't handle 'delete' action
		if (action !== 'delete') {
			await upsertPostToTypeSense(lesson, action)
		}
	},
	delete: async (lessonId: string) => {
		await deletePostInTypeSense(lessonId)
	},
	logger: searchLogger,
	eventPrefix: 'lesson',
})
