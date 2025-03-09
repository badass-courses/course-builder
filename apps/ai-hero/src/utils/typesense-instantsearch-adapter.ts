// Re-export from the shared package
// This file exists for backward compatibility
import {
	createDefaultConfig,
	createTypesenseAdapter,
	getTypesenseCollectionName,
} from '@coursebuilder/utils-search/typesense-adapter'

// App-specific configuration
const config = createDefaultConfig({
	apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY ?? '',
	host: process.env.NEXT_PUBLIC_TYPESENSE_HOST ?? 'test',
	port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT) ?? 8108,
	queryBy: 'title,description,summary',
	preset: 'updated_at_timestamp',
	sortBy: '_text_match:desc', // default sort
})

export const typesenseInstantsearchAdapter = createTypesenseAdapter(config)

export const TYPESENSE_COLLECTION_NAME = getTypesenseCollectionName({
	envVar: 'NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME',
	defaultValue: 'content_production',
})

// For backward compatibility
export const typsenseAdapterConfig = config
