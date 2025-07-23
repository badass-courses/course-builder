import { searchProvider } from '@/coursebuilder/search-provider'

import {
	ContentIndexingService,
	createContentSearchAdapter,
} from '@coursebuilder/core'
import type { ContentResource } from '@coursebuilder/core/schemas'

import type { PostAction } from './posts'

const getSearchProvider = () => {
	return searchProvider
}

// Create content indexing service instance
let contentIndexingService: ContentIndexingService | null = null
const getContentIndexingService = () => {
	if (!contentIndexingService) {
		const searchProvider = getSearchProvider()
		contentIndexingService = new ContentIndexingService(
			searchProvider,
			getSearchCollectionName(),
		)
	}
	return contentIndexingService
}

/**
 * Compatibility function for upsertResourceToTypeSense
 * Maintains the existing API while using the new provider underneath
 */
export async function upsertResourceToTypeSense(
	resource: ContentResource,
	action: PostAction,
): Promise<void> {
	try {
		const indexingService = getContentIndexingService()

		// Map PostAction to ContentAction
		const contentAction = action === 'publish' ? 'publish' : 'save'

		await indexingService.indexContentResource(resource, contentAction, {
			includeTags: true,
			includeParentResources: true,
			includeEmbedding: false, // Don't include embedding by default for performance
		})
	} catch (error) {
		console.error('⚠️ TypeSense indexing failed but continuing:', {
			error,
			resourceId: resource.id,
			action,
		})
		// Don't rethrow - let the operation succeed even if TypeSense fails
	}
}

/**
 * Compatibility function for deleteResourceInTypeSense
 */
export async function deleteResourceInTypeSense(
	resourceId: string,
): Promise<void> {
	try {
		const indexingService = getContentIndexingService()
		await indexingService.deleteContentResource(resourceId)
	} catch (error) {
		console.error('⚠️ TypeSense deletion failed but continuing:', {
			error,
			resourceId,
		})
		// Don't rethrow - let the operation succeed even if TypeSense fails
	}
}

/**
 * Compatibility function for indexAllContentToTypeSense
 */
export async function indexAllContentToTypeSense(
	resources: ContentResource[],
	deleteFirst = true,
): Promise<void> {
	try {
		const indexingService = getContentIndexingService()

		// If deleteFirst is true, we could delete all documents first
		// For now, we'll just do a bulk upsert which should overwrite existing docs
		if (deleteFirst) {
			console.log(
				'Note: deleteFirst=true behavior not yet implemented in new provider',
			)
		}

		// Filter to only index eligible content
		const indexableResources = resources.filter(
			(resource) =>
				(resource?.fields?.state === 'published' &&
					resource.fields.visibility === 'public' &&
					(resource.type === 'post' ||
						resource.type === 'tutorial' ||
						resource.type === 'workshop' ||
						resource.type === 'article' ||
						resource.type === 'lesson')) ||
				resource.type === 'list',
		)

		const result = await indexingService.bulkIndexResources(
			indexableResources,
			{
				includeTags: true,
				includeParentResources: true,
				includeEmbedding: false,
			},
		)

		console.log('Bulk indexing completed:', result)
	} catch (error) {
		console.error('⚠️ Bulk TypeSense indexing failed:', error)
		throw error
	}
}

/**
 * Compatibility function for getNearestNeighbour (vector search)
 */
export async function getNearestNeighbour(
	documentId: string,
	numberOfNearestNeighborsToReturn: number,
	distanceThreshold: number,
): Promise<any> {
	try {
		const searchProvider = getSearchProvider()

		// First search for the document by ID to extract its embedding
		const searchResult = await searchProvider.searchDocuments({
			collectionName: getSearchCollectionName(),
			query: '*',
			filterBy: `id:=${documentId}`,
			limit: 1,
		})

		const document = searchResult.hits?.[0]?.document

		if (!document?.embedding) {
			console.debug(`Document ${documentId} not found or has no embedding`)
			return null
		}

		// Use multi_search for large vector queries to avoid URL length limits

		const searches = [
			{
				collection: getSearchCollectionName(),
				q: '*',
				vector_query: `embedding:([${document.embedding.join(', ')}], k:${numberOfNearestNeighborsToReturn}, distance_threshold: ${distanceThreshold})`,
				filter_by: `id:!=${documentId} && state:=published && type:=[article,post,event,list]`,
				exclude_fields: 'embedding',
			},
		]

		const result = await searchProvider.multiSearch(searches)

		// Extract hits from multi-search result (first search in the array)
		const multiSearchResult = result.results?.[0] as any
		const hits = multiSearchResult?.hits || []
		if (hits.length === 0) return null

		const randomIndex = Math.floor(Math.random() * hits.length)
		return hits[randomIndex]?.document
	} catch (error) {
		console.debug('Vector search failed:', error)
		return null
	}
}

/**
 * Create InstantSearch adapter with compatibility with existing usage
 */
export function createCompatibleInstantSearchAdapter() {
	const searchProvider = getSearchProvider()

	return createContentSearchAdapter({
		apiKey: searchProvider.apiKey,
		host: searchProvider.nodes[0]?.host || 'localhost',
		port: searchProvider.nodes[0]?.port || 8108,
		collectionName: searchProvider.defaultCollection,
		protocol: searchProvider.nodes[0]?.protocol || 'https',
		excludeFields: ['embedding'],
		additionalSearchParameters: {
			// Add any default parameters that were in the original adapter
		},
	})
}

/**
 * Utility to get the collection name (maintains existing behavior)
 */
export function getSearchCollectionName() {
	const searchProvider = getSearchProvider()
	return searchProvider.defaultCollection || 'content_production'
}
