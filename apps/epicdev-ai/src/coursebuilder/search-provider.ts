import { TypesenseProvider } from '@coursebuilder/core'

// Validate and process environment variables
const typesenseConfig = {
	apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY ?? '',
	writeApiKey: process.env.TYPESENSE_WRITE_API_KEY,
	host: process.env.NEXT_PUBLIC_TYPESENSE_HOST ?? 'localhost',
	port: process.env.NEXT_PUBLIC_TYPESENSE_PORT
		? Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT)
		: 8108,
	collectionName:
		process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME ?? 'content_production',
}

// Log configuration for debugging (without sensitive keys)
console.log('🔍 Typesense Config:', {
	host: typesenseConfig.host,
	port: typesenseConfig.port,
	collectionName: typesenseConfig.collectionName,
	hasApiKey: !!typesenseConfig.apiKey,
	hasWriteKey: !!typesenseConfig.writeApiKey,
})

export const searchProvider = TypesenseProvider({
	apiKey: typesenseConfig.apiKey,
	writeApiKey: typesenseConfig.writeApiKey,
	nodes: [
		{
			host: typesenseConfig.host,
			port: typesenseConfig.port,
			protocol: 'https',
		},
	],
	connectionTimeoutSeconds: 2,
	defaultCollection: typesenseConfig.collectionName,
})
