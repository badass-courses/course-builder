/**
 * Logger interface for search indexing.
 * Flexible to work with various logger implementations.
 */
export interface SearchLogger {
	error: (
		event: string,
		data?: Record<string, unknown> | Record<string, any>,
	) => Promise<void> | void
	info: (
		event: string,
		data?: Record<string, unknown> | Record<string, any>,
	) => Promise<void> | void
}

/**
 * Search action types
 */
export type SearchAction =
	| 'save'
	| 'publish'
	| 'archive'
	| 'unpublish'
	| 'delete'

/**
 * Configuration for search indexing
 */
export interface SearchConfig<T> {
	/** Function to upsert a document to search index */
	upsert: (document: T, action: SearchAction) => Promise<void>
	/** Function to delete a document from search index */
	delete: (documentId: string) => Promise<void>
	/** Optional logger for search events */
	logger?: SearchLogger
	/** Event prefix for logging (e.g., 'post', 'lesson') */
	eventPrefix?: string
}

/**
 * Creates a search indexing configuration.
 *
 * @example
 * ```ts
 * // In your app's query-config.ts
 * import { upsertPostToTypeSense, deletePostInTypeSense } from './typesense-query'
 * import { log } from '@/server/logger'
 *
 * export const postSearchConfig = createSearchConfig<Post>({
 *   upsert: upsertPostToTypeSense,
 *   delete: deletePostInTypeSense,
 *   logger: log,
 *   eventPrefix: 'post',
 * })
 * ```
 */
export function createSearchConfig<T>(
	config: SearchConfig<T>,
): SearchConfig<T> {
	return config
}

/**
 * Options for search indexing operations
 */
export interface IndexingOptions {
	/** The action being performed */
	action: SearchAction
	/** Event name for logging (e.g., 'post.create', 'lesson.update') */
	eventName: string
}

/**
 * Indexes a document in the search engine with error handling.
 * Errors are logged but don't fail the operation (fire-and-forget pattern).
 *
 * @example
 * ```ts
 * const post = await createPostInDb(input)
 *
 * await indexDocument(postSearchConfig, post, {
 *   action: 'save',
 *   eventName: 'post.create',
 * })
 *
 * return post
 * ```
 */
export async function indexDocument<T extends { id: string }>(
	config: SearchConfig<T>,
	document: T,
	options: IndexingOptions,
): Promise<void> {
	try {
		await config.upsert(document, options.action)
		await config.logger?.info(`${options.eventName}.indexed`, {
			documentId: document.id,
			action: options.action,
		})
	} catch (error) {
		await config.logger?.error(`${options.eventName}.index.failed`, {
			documentId: document.id,
			action: options.action,
			error: error instanceof Error ? error.message : String(error),
		})
		// Don't rethrow - search indexing failure shouldn't fail the main operation
	}
}

/**
 * Removes a document from the search index with error handling.
 *
 * @example
 * ```ts
 * await deletePostFromDb(postId)
 * await removeFromIndex(postSearchConfig, postId, 'post.delete')
 * ```
 */
export async function removeFromIndex<T>(
	config: SearchConfig<T>,
	documentId: string,
	eventName: string,
): Promise<void> {
	try {
		await config.delete(documentId)
		await config.logger?.info(`${eventName}.removed`, {
			documentId,
		})
	} catch (error) {
		await config.logger?.error(`${eventName}.remove.failed`, {
			documentId,
			error: error instanceof Error ? error.message : String(error),
		})
		// Don't rethrow - search indexing failure shouldn't fail the main operation
	}
}

/**
 * Wraps a result with search indexing. Returns the result after indexing.
 * Useful for chaining after mutations.
 *
 * @example
 * ```ts
 * const post = await createPostInDb(input)
 * return withSearchIndexing(postSearchConfig, post, {
 *   action: 'save',
 *   eventName: 'post.create',
 * })
 * ```
 */
export async function withSearchIndexing<T extends { id: string }>(
	config: SearchConfig<T>,
	result: T,
	options: IndexingOptions,
): Promise<T> {
	await indexDocument(config, result, options)
	return result
}

/**
 * Creates a mutation wrapper that automatically handles search indexing.
 *
 * @example
 * ```ts
 * const createPostWithIndexing = createIndexedMutation(
 *   postSearchConfig,
 *   async (input: NewPostInput) => {
 *     return await createPostInDb(input)
 *   },
 *   { action: 'save', eventName: 'post.create' }
 * )
 *
 * // Usage:
 * const post = await createPostWithIndexing(input)
 * // Post is automatically indexed
 * ```
 */
export function createIndexedMutation<TInput, TResult extends { id: string }>(
	config: SearchConfig<TResult>,
	mutation: (input: TInput) => Promise<TResult>,
	options: IndexingOptions,
): (input: TInput) => Promise<TResult> {
	return async (input: TInput): Promise<TResult> => {
		const result = await mutation(input)
		await indexDocument(config, result, options)
		return result
	}
}

/**
 * Creates a delete mutation wrapper that removes from search index.
 *
 * @example
 * ```ts
 * const deletePostWithIndexing = createIndexedDelete(
 *   postSearchConfig,
 *   async (id: string) => {
 *     await deletePostFromDb(id)
 *     return true
 *   },
 *   'post.delete'
 * )
 * ```
 */
export function createIndexedDelete<TResult>(
	config: SearchConfig<unknown>,
	deleteFn: (id: string) => Promise<TResult>,
	eventName: string,
): (id: string) => Promise<TResult> {
	return async (id: string): Promise<TResult> => {
		const result = await deleteFn(id)
		await removeFromIndex(config, id, eventName)
		return result
	}
}
