import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
import type { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration'

/**
 * Configuration for Typesense adapter
 */
export type TypesenseAdapterConfig = {
	/**
	 * Typesense server configuration
	 */
	server: ConfigurationOptions
	/**
	 * Additional search parameters
	 */
	additionalSearchParameters: Record<string, string>
}

/**
 * Creates a Typesense-InstantSearch adapter for search functionality
 *
 * This utility creates an adapter that connects Algolia InstantSearch
 * to a Typesense search backend.
 *
 * @param config - The adapter configuration
 * @param config.server - Typesense server configuration with API key and node details
 * @param config.additionalSearchParameters - Additional search parameters like query_by, sort_by, etc.
 * @returns A configured TypesenseInstantSearchAdapter instance
 *
 * @example
 * ```ts
 * const adapter = createTypesenseAdapter({
 *   server: {
 *     apiKey: process.env.TYPESENSE_API_KEY,
 *     nodes: [
 *       {
 *         host: process.env.TYPESENSE_HOST,
 *         port: 8108,
 *         protocol: 'https',
 *       },
 *     ],
 *   },
 *   additionalSearchParameters: {
 *     query_by: 'title,description',
 *     preset: 'updated_at_timestamp',
 *   },
 * });
 * ```
 */
export function createTypesenseAdapter(
	config: TypesenseAdapterConfig,
): TypesenseInstantSearchAdapter {
	return new TypesenseInstantSearchAdapter(config)
}

/**
 * Creates a default Typesense-InstantSearch adapter configuration
 *
 * @param options - Override options for the default configuration
 * @param options.apiKey - Typesense API key
 * @param options.host - Typesense host
 * @param options.port - Typesense port
 * @param options.protocol - Typesense protocol
 * @param options.queryBy - Fields to query (comma-separated)
 * @param options.preset - Search preset
 * @param options.sortBy - Sort order (optional)
 * @returns A TypesenseAdapterConfig object
 *
 * @example
 * ```ts
 * const config = createDefaultConfig({
 *   apiKey: process.env.TYPESENSE_API_KEY,
 *   host: process.env.TYPESENSE_HOST,
 *   queryBy: 'title,description,summary',
 *   preset: 'updated_at_timestamp',
 * });
 * ```
 */
export function createDefaultConfig({
	apiKey = '',
	host = 'localhost',
	port = 8108,
	protocol = 'https',
	queryBy = 'title,description',
	preset = 'updated_at_timestamp',
	sortBy,
}: {
	apiKey?: string
	host?: string
	port?: number
	protocol?: string
	queryBy?: string
	preset?: string
	sortBy?: string
} = {}): TypesenseAdapterConfig {
	const additionalSearchParameters: Record<string, string> = {
		query_by: queryBy,
		preset,
	}

	if (sortBy) {
		additionalSearchParameters.sort_by = sortBy
	}

	return {
		server: {
			apiKey,
			nodes: [
				{
					host,
					path: '',
					port,
					protocol,
				},
			],
			cacheSearchResultsForSeconds: 2 * 60,
		},
		additionalSearchParameters,
	}
}

/**
 * Gets the collection name from environment variables
 * with a fallback to a default value
 *
 * @param options - Options for getting the collection name
 * @param options.envVar - The environment variable name to check
 * @param options.defaultValue - The default value if the environment variable is not set
 * @returns The collection name from environment or the default
 *
 * @example
 * ```ts
 * const collectionName = getTypesenseCollectionName({
 *   envVar: 'NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME',
 *   defaultValue: 'content_production'
 * });
 * ```
 */
export function getTypesenseCollectionName({
	envVar = 'TYPESENSE_COLLECTION_NAME',
	defaultValue = 'content_production',
}: {
	envVar?: string
	defaultValue?: string
} = {}): string {
	if (typeof process !== 'undefined' && process.env) {
		return process.env[envVar] || defaultValue
	}
	return defaultValue
}
