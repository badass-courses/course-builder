/**
 * Query configuration for egghead app.
 * Centralizes auth, logging, and search indexing settings for query utilities.
 */
import { logger } from '@/lib/utils/logger'
import { getServerAuthSession } from '@/server/auth'

import {
	createSearchConfig,
	type AuthConfig,
	type AuthLogger,
	type SearchAction,
	type SearchLogger,
} from '@coursebuilder/next/query'

import type { Post, PostAction } from './posts'
import { upsertPostToTypeSense } from './typesense/post'

// Create a logger wrapper that matches the expected interface
const authLogger: AuthLogger = {
	error: (event, data) => logger.error(event, data ?? {}),
	info: (event, data) => logger.info(event, data ?? {}),
}

const searchLogger: SearchLogger = {
	error: (event, data) => logger.error(event, data ?? {}),
	info: (event, data) => logger.info(event, data ?? {}),
}

/**
 * Auth configuration for egghead.
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
		// TypeSense upsert doesn't handle 'delete' action in egghead
		// Deletion is handled within upsertPostToTypeSense based on post state
		if (action !== 'delete') {
			await upsertPostToTypeSense(post, action as PostAction)
		}
	},
	delete: async (postId: string) => {
		// Deletion is handled within upsertPostToTypeSense based on post state
		// The egghead implementation checks post.fields.state and post.fields.visibility
		// to determine if a post should be removed from the index
		searchLogger.info('Post deletion requested', { postId })
	},
	logger: searchLogger,
	eventPrefix: 'post',
})
