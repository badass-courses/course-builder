import { logger } from '../../lib/utils/logger'
import type { ContentResource } from '../../schemas'
import type { SearchProviderConfig } from '../index'
import {
	ContentTransformOptions,
	getDefaultSearchableContentCollectionSchema,
	SearchableResource,
	SearchableResourceSchema,
	SearchableResourceTransformOptionsSchema,
} from './schemas'

export type ContentAction = 'create' | 'update' | 'delete' | 'publish' | 'save'

export class ContentIndexingService {
	private searchProvider: SearchProviderConfig
	private defaultCollection: string

	constructor(
		searchProvider: SearchProviderConfig,
		defaultCollection?: string,
	) {
		this.searchProvider = searchProvider
		this.defaultCollection =
			defaultCollection || searchProvider.defaultCollection || 'content'
	}

	/**
	 * Index a single content resource
	 */
	async indexContentResource(
		resource: ContentResource,
		action: ContentAction,
		options?: Partial<ContentTransformOptions>,
	): Promise<void> {
		try {
			if (action === 'delete') {
				await this.deleteContentResource(resource.id)
				return
			}

			const searchableContent = await this.transformResource(resource, options)

			if (!searchableContent) {
				logger.debug('Resource not eligible for indexing', {
					resourceId: resource.id,
					type: resource.type,
				})
				return
			}

			await this.searchProvider.upsertDocument({
				collectionName: this.defaultCollection,
				document: {
					...searchableContent,
					...(action === 'publish' && {
						published_at_timestamp: resource.updatedAt?.getTime() ?? Date.now(),
					}),
				},
				id: resource.id,
			})

			logger.debug('Content resource indexed successfully', {
				resourceId: resource.id,
				type: resource.type,
				action,
				collectionName: this.defaultCollection,
			})
		} catch (error: any) {
			logger.error(
				new Error(
					`Failed to index content resource: ${error.message || error}`,
				),
			)
			throw error
		}
	}

	/**
	 * Delete content resource from search index
	 */
	async deleteContentResource(resourceId: string): Promise<void> {
		try {
			await this.searchProvider.deleteDocument({
				collectionName: this.defaultCollection,
				documentId: resourceId,
			})

			logger.debug('Content resource deleted from index', {
				resourceId,
				collectionName: this.defaultCollection,
			})
		} catch (error: any) {
			logger.error(
				new Error(
					`Failed to delete content resource from index: ${error.message || error}`,
				),
			)
			throw error
		}
	}

	/**
	 * Bulk index multiple content resources
	 */
	async bulkIndexResources(
		resources: ContentResource[],
		options?: Partial<ContentTransformOptions>,
	): Promise<{ success: number; failed: number }> {
		try {
			logger.debug('Starting bulk index operation', {
				resourceCount: resources.length,
				collectionName: this.defaultCollection,
			})

			const transformedResources: SearchableResource[] = []
			let transformFailures = 0

			for (const resource of resources) {
				try {
					const searchableContent = await this.transformResource(
						resource,
						options,
					)
					if (searchableContent) {
						transformedResources.push(searchableContent)
					}
				} catch (error: any) {
					transformFailures++
					logger.error(
						new Error(
							`Failed to transform resource ${resource.id}: ${error.message}`,
						),
					)
				}
			}

			if (transformedResources.length > 0) {
				await this.searchProvider.bulkIndex({
					collectionName: this.defaultCollection,
					documents: transformedResources,
					action: 'upsert',
				})
			}

			const result = {
				success: transformedResources.length,
				failed: transformFailures,
			}

			logger.debug('Bulk index operation completed', {
				...result,
				totalResources: resources.length,
				collectionName: this.defaultCollection,
			})

			return result
		} catch (error: any) {
			logger.error(
				new Error(`Bulk index operation failed: ${error.message || error}`),
			)
			throw error
		}
	}

	/**
	 * Ensure collection exists with proper schema
	 */
	async ensureCollection(collectionName?: string): Promise<void> {
		const targetCollection = collectionName || this.defaultCollection

		try {
			// Try to get existing collection
			await this.searchProvider.getCollection(targetCollection)
			logger.debug('Collection already exists', {
				collectionName: targetCollection,
			})
		} catch (error: any) {
			// Collection doesn't exist, create it
			if (error.httpStatus === 404 || error.message?.includes('Not Found')) {
				logger.debug('Creating new collection', {
					collectionName: targetCollection,
				})

				const schema =
					getDefaultSearchableContentCollectionSchema(targetCollection)
				await this.searchProvider.createCollection({
					name: schema.name,
					fields: schema.fields as any,
					default_sorting_field: schema.default_sorting_field,
				})

				logger.debug('Collection created successfully', {
					collectionName: targetCollection,
				})
			} else {
				throw error
			}
		}
	}

	/**
	 * Transform ContentResource to SearchableContent
	 */
	async transformResource(
		resource: ContentResource,
		options?: Partial<ContentTransformOptions>,
	): Promise<SearchableResource | null> {
		try {
			const transformOptions = SearchableResourceTransformOptionsSchema.parse(
				options || {},
			)

			// Check if resource should be indexed based on filters
			if (transformOptions.filterByVisibility?.length) {
				const visibility = resource.fields?.visibility
				if (
					visibility &&
					!transformOptions.filterByVisibility.includes(visibility)
				) {
					return null
				}
			}

			if (transformOptions.filterByState?.length) {
				const state = resource.fields?.state
				if (state && !transformOptions.filterByState.includes(state)) {
					return null
				}
			}

			// Build basic searchable content
			const searchableContent: Partial<SearchableResource> = {
				id: resource.id,
				title: resource.fields?.title || '',
				slug: resource.fields?.slug || '',
				description:
					resource.fields?.body || resource.fields?.description || '',
				summary: resource.fields?.description || resource.fields?.summary || '',
				type: this.getResourceType(resource),
				visibility: resource.fields?.visibility || 'public',
				state: resource.fields?.state || 'draft',
				created_at_timestamp: resource.createdAt?.getTime() ?? Date.now(),
				updated_at_timestamp: resource.updatedAt?.getTime() ?? Date.now(),
				published_at_timestamp: resource.updatedAt?.getTime(),
			}

			// Add event-specific fields if present
			if (resource.fields?.startsAt) {
				searchableContent.startsAt = resource.fields.startsAt
			}
			if (resource.fields?.endsAt) {
				searchableContent.endsAt = resource.fields.endsAt
			}
			if (resource.fields?.timezone) {
				searchableContent.timezone = resource.fields.timezone
			}

			// Add tags if requested and available
			if (transformOptions.includeTags && resource.fields?.tags) {
				searchableContent.tags = this.transformTags(resource.fields.tags)
			}

			// Add parent resources if requested and available
			if (
				transformOptions.includeParentResources &&
				resource.fields?.parentResources
			) {
				searchableContent.parentResources = this.transformParentResources(
					resource.fields.parentResources,
				)
			}

			// Add embedding if requested and available
			if (transformOptions.includeEmbedding && resource.fields?.embedding) {
				searchableContent.embedding = resource.fields.embedding
			}

			// Add any additional metadata
			if (resource.fields) {
				const metadata: Record<string, any> = {}
				Object.entries(resource.fields).forEach(([key, value]) => {
					if (
						![
							'title',
							'slug',
							'body',
							'description',
							'summary',
							'visibility',
							'state',
							'startsAt',
							'endsAt',
							'timezone',
							'tags',
							'parentResources',
							'embedding',
						].includes(key)
					) {
						metadata[key] = value
					}
				})
				if (Object.keys(metadata).length > 0) {
					searchableContent.metadata = metadata
				}
			}

			// Validate the result
			const result = SearchableResourceSchema.safeParse(searchableContent)
			if (!result.success) {
				logger.error(
					new Error(
						`Invalid searchable content: ${JSON.stringify(result.error.format())}`,
					),
				)
				return null
			}

			return result.data
		} catch (error: any) {
			logger.error(
				new Error(`Failed to transform resource: ${error.message || error}`),
			)
			throw error
		}
	}

	/**
	 * Get the resource type for indexing
	 */
	private getResourceType(resource: ContentResource): string {
		// Handle different type field locations
		if (resource.fields && 'postType' in resource.fields) {
			return resource.fields.postType as string
		}
		if (resource.fields && 'type' in resource.fields) {
			return resource.fields.type as string
		}
		return resource.type
	}

	/**
	 * Transform tags to searchable format
	 */
	private transformTags(tags: any[]): any[] {
		return tags.map((tag) => {
			if (typeof tag === 'string') {
				return { label: tag }
			}
			return {
				id: tag.id,
				label: tag.label || tag.name,
				slug: tag.slug,
			}
		})
	}

	/**
	 * Transform parent resources to searchable format
	 */
	private transformParentResources(parentResources: any[]): any[] {
		return parentResources.map((resource) => ({
			id: resource.id,
			title: resource.title || resource.fields?.title,
			slug: resource.slug || resource.fields?.slug,
			type: resource.type,
			visibility: resource.visibility || resource.fields?.visibility,
			state: resource.state || resource.fields?.state,
		}))
	}

	/**
	 * Search for content with various options
	 */
	async searchContent(
		query: string,
		options?: {
			collectionName?: string
			limit?: number
			offset?: number
			filters?: string[]
			sortBy?: string
			includeFields?: string
			excludeFields?: string
		},
	) {
		const collectionName = options?.collectionName || this.defaultCollection

		return this.searchProvider.searchDocuments({
			collectionName,
			query,
			queryBy: 'title,description,summary',
			limit: options?.limit,
			offset: options?.offset,
			filterBy: options?.filters?.join(' && '),
			sortBy: options?.sortBy,
			includeFields: options?.includeFields,
			excludeFields: options?.excludeFields,
		})
	}

	/**
	 * Vector search for content
	 */
	async vectorSearchContent(
		vectorQuery: string,
		options?: {
			collectionName?: string
			k?: number
			distanceThreshold?: number
			filters?: string[]
			excludeFields?: string
		},
	) {
		const collectionName = options?.collectionName || this.defaultCollection

		return this.searchProvider.vectorSearch({
			collectionName,
			vectorQuery,
			k: options?.k,
			distanceThreshold: options?.distanceThreshold,
			filterBy: options?.filters?.join(' && '),
			excludeFields: options?.excludeFields,
		})
	}
}
