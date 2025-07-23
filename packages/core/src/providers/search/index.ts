// Main provider
export { default as TypesenseProvider } from '../typesense'

// Adapter and core functionality
export { TypesenseAdapter } from './adapter'

// Content indexing
export { ContentIndexingService } from './content-indexing'
export type { ContentAction } from './content-indexing'

// Schemas
export {
	SearchableResourceSchema as SearchableContentSchema,
	SearchableParentResourceSchema,
	SearchableTagSchema,
	SearchableResourceTransformOptionsSchema,
	SearchCollectionSchema,
	getDefaultSearchableContentCollectionSchema,
	searchableContentAttributeLabelMap,
} from './schemas'
export type {
	SearchableResource as SearchableContent,
	SearchableParentResource,
	SearchableTag,
	ContentTransformOptions,
	SearchCollectionDefinition,
} from './schemas'

// InstantSearch integration
export {
	createTypesenseInstantSearchAdapter,
	createDefaultConfig,
	createContentSearchAdapter,
	createCollectionNameFromEnv,
	createSearchClientFromProvider,
	createContentTypeAdapter,
	getSearchCollectionName,
	CONTENT_TYPE_SEARCH_CONFIGS,
} from './instant-search'
export type { TypesenseInstantSearchConfig } from './instant-search'
