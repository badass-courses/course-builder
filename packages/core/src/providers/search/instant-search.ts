import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'

import { logger } from '../../lib/utils/logger'

/**
 * Configuration for TypesenseInstantSearchAdapter
 */
export interface TypesenseInstantSearchConfig {
	apiKey: string
	host: string
	port: number
	protocol?: 'http' | 'https'
	queryBy: string
	collectionName?: string
	preset?:
		| 'updated_at_timestamp'
		| 'created_at_timestamp'
		| 'published_at_timestamp'
	sortBy?: string
	additionalSearchParameters?: Record<string, any>
	cacheSearchResultsForSeconds?: number
	connectionTimeoutSeconds?: number
	numTypoTolerantSearches?: number
	useServerSideSearchCache?: boolean
}

/**
 * Utility function to get collection name from environment or default
 */
export function getSearchCollectionName(options: {
	envVar?: string
	defaultValue: string
}): string {
	if (
		options.envVar &&
		typeof process !== 'undefined' &&
		process.env?.[options.envVar] &&
		process.env[options.envVar]!.trim() !== ''
	) {
		return process.env[options.envVar]!
	}
	return options.defaultValue
}

/**
 * Create default configuration for TypesenseInstantSearchAdapter
 */
export function createDefaultConfig(
	options: Omit<TypesenseInstantSearchConfig, 'additionalSearchParameters'> & {
		additionalSearchParameters?: Record<string, any>
	},
) {
	const baseConfig = {
		server: {
			apiKey: options.apiKey,
			nodes: [
				{
					host: options.host,
					port: options.port,
					protocol: options.protocol || 'https',
				},
			],
			connectionTimeoutSeconds: options.connectionTimeoutSeconds || 2,
			cacheSearchResultsForSeconds:
				options.cacheSearchResultsForSeconds || 2 * 60,
			useServerSideSearchCache: options.useServerSideSearchCache ?? true,
		},
		additionalSearchParameters: {
			query_by: options.queryBy,
			...(options.preset && { preset: options.preset }),
			...(options.sortBy && { sort_by: options.sortBy }),
			num_typos: options.numTypoTolerantSearches || 2,
			...options.additionalSearchParameters,
		},
	}

	logger.debug('Created TypesenseInstantSearch config', {
		host: options.host,
		port: options.port,
		protocol: options.protocol || 'https',
		queryBy: options.queryBy,
		collectionName: options.collectionName,
	})

	return baseConfig
}

/**
 * Factory function for creating TypesenseInstantSearchAdapter instances
 */
export function createTypesenseInstantSearchAdapter(
	config: TypesenseInstantSearchConfig,
): TypesenseInstantSearchAdapter {
	try {
		// logger.debug('Creating TypesenseInstantSearchAdapter', {
		// 	host: config.host,
		// 	collectionName: config.collectionName,
		// })

		const adapterConfig = createDefaultConfig(config)
		const adapter = new TypesenseInstantSearchAdapter(adapterConfig)

		// logger.debug('TypesenseInstantSearchAdapter created successfully')

		return adapter
	} catch (error: any) {
		logger.error(
			new Error(
				`Failed to create TypesenseInstantSearchAdapter: ${error.message || error}`,
			),
		)
		throw error
	}
}

/**
 * Create a configured adapter for content search
 */
export function createContentSearchAdapter(options: {
	apiKey: string
	host: string
	port?: number
	protocol?: 'http' | 'https'
	collectionName?: string
	excludeFields?: string[]
	queryBy?: string
	preset?:
		| 'updated_at_timestamp'
		| 'created_at_timestamp'
		| 'published_at_timestamp'
	sortBy?: string
	additionalSearchParameters?: Record<string, any>
}): TypesenseInstantSearchAdapter {
	const config: TypesenseInstantSearchConfig = {
		apiKey: options.apiKey,
		host: options.host,
		port: options.port || 443,
		protocol: options.protocol || 'https',
		queryBy: options.queryBy || 'title,description,summary',
		collectionName: options.collectionName,
		preset: options.preset || 'updated_at_timestamp',
		sortBy: options.sortBy || '_text_match:desc',
		additionalSearchParameters: {
			...(options.excludeFields && {
				exclude_fields: options.excludeFields.join(','),
			}),
			...options.additionalSearchParameters,
		},
	}

	return createTypesenseInstantSearchAdapter(config)
}

/**
 * Utility to create collection name from environment variables
 */
export function createCollectionNameFromEnv(
	envVar: string,
	fallback: string,
): string {
	return getSearchCollectionName({
		envVar,
		defaultValue: fallback,
	})
}

/**
 * Helper to create search client from provider config
 */
export function createSearchClientFromProvider(
	searchProvider: {
		apiKey: string
		nodes: Array<{ host: string; port: number; protocol: 'http' | 'https' }>
	},
	queryBy: string = 'title,description,summary',
	additionalParams?: Record<string, any>,
): TypesenseInstantSearchAdapter {
	const primaryNode = searchProvider.nodes[0]
	if (!primaryNode) {
		throw new Error('No nodes available in search provider configuration')
	}

	return createTypesenseInstantSearchAdapter({
		apiKey: searchProvider.apiKey,
		host: primaryNode.host,
		port: primaryNode.port,
		protocol: primaryNode.protocol,
		queryBy,
		additionalSearchParameters: additionalParams,
	})
}

/**
 * Default search parameters for different content types
 */
export const CONTENT_TYPE_SEARCH_CONFIGS = {
	posts: {
		queryBy: 'title,description,summary',
		filters: 'type:post && state:published && visibility:public',
		sortBy: '_text_match:desc',
	},
	articles: {
		queryBy: 'title,description,summary',
		filters: 'type:article && state:published && visibility:public',
		sortBy: '_text_match:desc',
	},
	lessons: {
		queryBy: 'title,description,summary',
		filters: 'type:lesson && state:published',
		sortBy: '_text_match:desc',
	},
	workshops: {
		queryBy: 'title,description,summary',
		filters: 'type:workshop && state:published && visibility:public',
		sortBy: '_text_match:desc',
	},
	events: {
		queryBy: 'title,description,summary',
		filters: 'type:event && state:published && visibility:public',
		sortBy: 'startsAt:desc',
	},
	all: {
		queryBy: 'title,description,summary',
		filters: 'state:published && visibility:public',
		sortBy: '_text_match:desc',
	},
} as const

/**
 * Create pre-configured adapter for specific content types
 */
export function createContentTypeAdapter(
	contentType: keyof typeof CONTENT_TYPE_SEARCH_CONFIGS,
	baseConfig: Omit<
		TypesenseInstantSearchConfig,
		'queryBy' | 'additionalSearchParameters'
	>,
): TypesenseInstantSearchAdapter {
	const typeConfig = CONTENT_TYPE_SEARCH_CONFIGS[contentType]

	return createTypesenseInstantSearchAdapter({
		...baseConfig,
		queryBy: typeConfig.queryBy,
		sortBy: typeConfig.sortBy,
		additionalSearchParameters: {
			filter_by: typeConfig.filters,
		},
	})
}
