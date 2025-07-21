import { Client } from 'typesense'

import { logger } from '../../lib/utils/logger'
import type {
	BulkIndexOptions,
	CreateCollectionOptions,
	DeleteDocumentOptions,
	SearchDocumentOptions,
	SearchProviderConsumerConfig,
	UpsertDocumentOptions,
	VectorSearchOptions,
} from '../index'
import {
	CollectionSchemaResponseSchema,
	MultiSearchResultsSchema,
	SearchResultsSchema,
	type CollectionSchemaResponse,
	type MultiSearchResults,
	type SearchResults,
} from './schemas'

export class TypesenseAdapter {
	private readClient: Client
	private writeClient: Client
	private config: SearchProviderConsumerConfig

	constructor(config: SearchProviderConsumerConfig) {
		this.config = config

		// Initialize read client
		this.readClient = new Client({
			nodes: config.nodes,
			apiKey: config.apiKey,
			connectionTimeoutSeconds: config.connectionTimeoutSeconds || 2,
		})

		// Initialize write client (can be same as read if no separate write key)
		this.writeClient = config.writeApiKey
			? new Client({
					nodes: config.nodes,
					apiKey: config.writeApiKey,
					connectionTimeoutSeconds: config.connectionTimeoutSeconds || 2,
				})
			: this.readClient

		logger.debug('TypesenseAdapter initialized', {
			host: config.nodes[0]?.host,
			hasWriteKey: !!config.writeApiKey,
			defaultCollection: config.defaultCollection,
		})
	}

	async upsertDocument(options: UpsertDocumentOptions): Promise<any> {
		try {
			logger.debug('upserting document', {
				collectionName: options.collectionName,
				documentId: options.id || 'auto-generated',
			})

			const result = await this.writeClient
				.collections(options.collectionName)
				.documents()
				.upsert(options.document)

			logger.debug('document upserted successfully', {
				collectionName: options.collectionName,
				documentId: (result as any).id,
			})

			return result
		} catch (error: any) {
			logger.error(
				new Error(`Failed to upsert document: ${error.message || error}`),
			)
			throw error
		}
	}

	async deleteDocument(options: DeleteDocumentOptions): Promise<void> {
		try {
			logger.debug('deleting document', {
				collectionName: options.collectionName,
				documentId: options.documentId,
			})

			await this.writeClient
				.collections(options.collectionName)
				.documents(options.documentId)
				.delete()

			logger.debug('document deleted successfully', {
				collectionName: options.collectionName,
				documentId: options.documentId,
			})
		} catch (error: any) {
			// Check if error is "Document not found" - that's actually fine
			if (error.message?.includes('Not Found') || error.httpStatus === 404) {
				logger.debug('document not found (already deleted)', {
					collectionName: options.collectionName,
					documentId: options.documentId,
				})
				return
			}

			logger.error(
				new Error(`Failed to delete document: ${error.message || error}`),
			)
			throw error
		}
	}

	async searchDocuments(
		options: SearchDocumentOptions,
	): Promise<SearchResults> {
		try {
			logger.debug('searching documents', {
				collectionName: options.collectionName,
				query: options.query,
				limit: options.limit,
			})

			const searchParams: any = {
				q: options.query,
				query_by: options.queryBy || '',
				...(options.filterBy && { filter_by: options.filterBy }),
				...(options.sortBy && { sort_by: options.sortBy }),
				...(options.facetBy && { facet_by: options.facetBy }),
				...(options.maxFacetValues && {
					max_facet_values: options.maxFacetValues,
				}),
				...(options.limit && { per_page: options.limit }),
				...(options.offset && {
					page: Math.floor(options.offset / (options.limit || 10)) + 1,
				}),
				...(options.includeFields && { include_fields: options.includeFields }),
				...(options.excludeFields && { exclude_fields: options.excludeFields }),
			}

			const rawResult = await this.readClient
				.collections(options.collectionName)
				.documents()
				.search(searchParams)

			// Parse and validate the response
			const parseResult = SearchResultsSchema.safeParse(rawResult)
			if (!parseResult.success) {
				const parseError = new Error(
					`Failed to parse search response. Issues: ${JSON.stringify(parseResult.error.errors)}`,
				)
				logger.error(parseError)
				throw parseError
			}

			const result = parseResult.data

			logger.debug('search completed', {
				collectionName: options.collectionName,
				found: result.found,
				searchTimeMs: result.search_time_ms,
			})

			return result
		} catch (error: any) {
			logger.error(new Error(`Search failed: ${error.message || error}`))
			throw error
		}
	}

	async vectorSearch(options: VectorSearchOptions): Promise<SearchResults> {
		try {
			logger.debug('performing vector search', {
				collectionName: options.collectionName,
				k: options.k,
				distanceThreshold: options.distanceThreshold,
			})

			const searchParams: any = {
				q: '*',
				vector_query: options.vectorQuery,
				...(options.filterBy && { filter_by: options.filterBy }),
				...(options.excludeFields && { exclude_fields: options.excludeFields }),
			}

			const rawResult = await this.readClient
				.collections(options.collectionName)
				.documents()
				.search(searchParams)

			// Parse and validate the response
			const parseResult = SearchResultsSchema.safeParse(rawResult)
			if (!parseResult.success) {
				const parseError = new Error(
					`Failed to parse vector search response. Issues: ${JSON.stringify(parseResult.error.errors)}`,
				)
				logger.error(parseError)
				throw parseError
			}

			const result = parseResult.data

			logger.debug('vector search completed', {
				collectionName: options.collectionName,
				found: result.found,
				searchTimeMs: result.search_time_ms,
			})

			return result
		} catch (error: any) {
			logger.error(new Error(`Vector search failed: ${error.message || error}`))
			throw error
		}
	}

	async bulkIndex(options: BulkIndexOptions): Promise<void> {
		try {
			logger.debug('starting bulk index operation', {
				collectionName: options.collectionName,
				documentCount: options.documents.length,
				action: options.action || 'upsert',
				batchSize: options.batchSize || 100,
			})

			const batchSize = options.batchSize || 100
			const batches = []

			// Split documents into batches
			for (let i = 0; i < options.documents.length; i += batchSize) {
				batches.push(options.documents.slice(i, i + batchSize))
			}

			let processedCount = 0
			for (const batch of batches) {
				try {
					await this.writeClient
						.collections(options.collectionName)
						.documents()
						.import(batch, { action: options.action || 'upsert' })

					processedCount += batch.length
					logger.debug('batch processed', {
						batchSize: batch.length,
						processedCount,
						totalCount: options.documents.length,
					})
				} catch (batchError: any) {
					logger.error(
						new Error(`Batch failed: ${batchError.message || batchError}`),
					)
					// Continue with next batch instead of failing entirely
				}
			}

			logger.debug('bulk index operation completed', {
				collectionName: options.collectionName,
				totalDocuments: options.documents.length,
				processedCount,
			})
		} catch (error: any) {
			logger.error(
				new Error(`Bulk index operation failed: ${error.message || error}`),
			)
			throw error
		}
	}

	async createCollection(options: CreateCollectionOptions): Promise<void> {
		try {
			logger.debug('creating collection', {
				name: options.name,
				fieldCount: options.fields.length,
			})

			await this.writeClient.collections().create({
				name: options.name,
				fields: options.fields as any,
				...(options.default_sorting_field && {
					default_sorting_field: options.default_sorting_field,
				}),
			})

			logger.debug('collection created successfully', {
				name: options.name,
			})
		} catch (error: any) {
			logger.error(
				new Error(`Failed to create collection: ${error.message || error}`),
			)
			throw error
		}
	}

	async deleteCollection(collectionName: string): Promise<void> {
		try {
			logger.debug('deleting collection', { collectionName })

			await this.writeClient.collections(collectionName).delete()

			logger.debug('collection deleted successfully', { collectionName })
		} catch (error: any) {
			logger.error(
				new Error(`Failed to delete collection: ${error.message || error}`),
			)
			throw error
		}
	}

	async getCollection(
		collectionName: string,
	): Promise<CollectionSchemaResponse> {
		try {
			logger.debug('retrieving collection schema', { collectionName })

			const rawResult = await this.readClient
				.collections(collectionName)
				.retrieve()

			// Parse and validate the response
			const parseResult = CollectionSchemaResponseSchema.safeParse(rawResult)
			if (!parseResult.success) {
				const parseError = new Error(
					`Failed to parse collection schema response. Issues: ${JSON.stringify(parseResult.error.errors)}`,
				)
				logger.error(parseError)
				throw parseError
			}

			const result = parseResult.data

			logger.debug('collection schema retrieved', {
				collectionName,
				numDocuments: result.num_documents,
			})

			return result
		} catch (error: any) {
			logger.error(
				new Error(`Failed to retrieve collection: ${error.message || error}`),
			)
			throw error
		}
	}

	async multiSearch(
		searches: Array<{
			collection: string
			q: string
			query_by?: string
			filter_by?: string
			vector_query?: string
			exclude_fields?: string
		}>,
	): Promise<MultiSearchResults> {
		try {
			logger.debug('performing multi-search', {
				searchCount: searches.length,
			})

			const rawResult = await this.readClient.multiSearch.perform({
				searches,
			})

			// Parse and validate the response
			const parseResult = MultiSearchResultsSchema.safeParse(rawResult)
			if (!parseResult.success) {
				const parseError = new Error(
					`Failed to parse multi-search response. Issues: ${JSON.stringify(parseResult.error.errors)}`,
				)
				logger.error(parseError)
				throw parseError
			}

			const result = parseResult.data

			logger.debug('multi-search completed', {
				searchCount: searches.length,
				results: result.results.length,
			})

			return result
		} catch (error: any) {
			logger.error(new Error(`Multi-search failed: ${error.message || error}`))
			throw error
		}
	}
}
