import Typesense from 'typesense'

/**
 * TypeSense client configuration
 */
export interface TypesenseClientConfig {
	host?: string
	hostHash?: string
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
	hostHash: process.env.NEXT_PUBLIC_TYPESENSE_HOST_HASH,
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
		nearestNode: {
			host: config.host!,
			port: config.port!,
			protocol: config.protocol!,
		},
		nodes: [
			{
				host: `${config.hostHash}-1.a1.typesense.net`,
				port: config.port!,
				protocol: config.protocol!,
			},
			{
				host: `${config.hostHash}-2.a1.typesense.net`,
				port: config.port!,
				protocol: config.protocol!,
			},
			{
				host: `${config.hostHash}-3.a1.typesense.net`,
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
