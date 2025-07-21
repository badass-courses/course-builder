import type {
	BulkIndexOptions,
	CreateCollectionOptions,
	DeleteDocumentOptions,
	SearchDocumentOptions,
	SearchProviderConfig,
	SearchProviderConsumerConfig,
	UpsertDocumentOptions,
	VectorSearchOptions,
} from './index'
import { TypesenseAdapter } from './search/adapter'

export default function TypesenseProvider(
	options: SearchProviderConsumerConfig,
): SearchProviderConfig {
	const adapter = new TypesenseAdapter(options)

	return {
		id: 'typesense',
		name: 'Typesense',
		type: 'search',
		options,
		nodes: options.nodes,
		apiKey: options.apiKey,
		writeApiKey: options.writeApiKey,
		connectionTimeoutSeconds: options.connectionTimeoutSeconds,
		defaultCollection: options.defaultCollection,

		// Core operations - delegate to adapter
		async upsertDocument(upsertOptions: UpsertDocumentOptions) {
			return adapter.upsertDocument(upsertOptions)
		},

		async deleteDocument(deleteOptions: DeleteDocumentOptions) {
			return adapter.deleteDocument(deleteOptions)
		},

		async searchDocuments(searchOptions: SearchDocumentOptions) {
			return adapter.searchDocuments(searchOptions)
		},

		async vectorSearch(vectorOptions: VectorSearchOptions) {
			return adapter.vectorSearch(vectorOptions)
		},

		async bulkIndex(bulkOptions: BulkIndexOptions) {
			return adapter.bulkIndex(bulkOptions)
		},

		// Collection management
		async createCollection(collectionOptions: CreateCollectionOptions) {
			return adapter.createCollection(collectionOptions)
		},

		async deleteCollection(collectionName: string) {
			return adapter.deleteCollection(collectionName)
		},

		async getCollection(collectionName: string) {
			return adapter.getCollection(collectionName)
		},

		// Multi-search
		async multiSearch(searches) {
			return adapter.multiSearch(searches)
		},
	}
}

// Export the adapter for direct usage if needed
export { TypesenseAdapter }
