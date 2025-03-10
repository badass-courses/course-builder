import Typesense from 'typesense'

/**
 * TypeSense client configuration
 */
export interface TypesenseClientConfig {
	host?: string
	port?: number
	protocol?: string
	apiKey?: string
	connectionTimeoutSeconds?: number
}

/**
 * Default TypeSense client configuration
 */
export const DEFAULT_TYPESENSE_CONFIG: TypesenseClientConfig = {
	host: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
	port: 443,
	protocol: 'https',
	apiKey: process.env.TYPESENSE_WRITE_API_KEY,
	connectionTimeoutSeconds: 2,
}

/**
 * Create a TypeSense client with the provided configuration
 * @param config - The TypeSense client configuration (optional)
 * @returns A TypeSense client instance
 */
export function createTypesenseClient(
	config: TypesenseClientConfig = DEFAULT_TYPESENSE_CONFIG,
) {
	return new Typesense.Client({
		nodes: [
			{
				host: config.host!,
				port: config.port!,
				protocol: config.protocol!,
			},
		],
		apiKey: config.apiKey!,
		connectionTimeoutSeconds: config.connectionTimeoutSeconds,
	})
}

/**
 * Get the TypeSense collection name from environment variables
 * @returns The TypeSense collection name
 */
export function getTypesenseCollectionName(): string {
	return process.env.TYPESENSE_COLLECTION_NAME || 'lessons'
}
