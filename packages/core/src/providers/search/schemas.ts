import { z } from 'zod'

/**
 * Schema for parent resource references in search documents
 */
export const SearchableParentResourceSchema = z.object({
	id: z.string(),
	title: z.string(),
	slug: z.string(),
	type: z.string(),
	visibility: z.string().optional(),
	state: z.string().optional(),
})

/**
 * Schema for tag references in search documents
 */
export const SearchableTagSchema = z.object({
	id: z.string().optional(),
	label: z.string(),
	slug: z.string().optional(),
})

/**
 * Main schema for searchable content resources
 */
export const SearchableResourceSchema = z.object({
	id: z.string(),
	title: z.string(),
	slug: z.string(),
	description: z.string().optional(),
	summary: z.string().optional(),
	type: z.string(),
	visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
	state: z.enum(['draft', 'published', 'archived']).default('draft'),
	created_at_timestamp: z.number(),
	updated_at_timestamp: z.number(),
	published_at_timestamp: z.number().optional(),

	// Content categorization
	tags: z.array(SearchableTagSchema).optional(),
	parentResources: z.array(SearchableParentResourceSchema).optional(),

	// Vector search support
	embedding: z.array(z.number()).optional(),

	// Event-specific fields (optional)
	startsAt: z.string().optional(),
	endsAt: z.string().optional(),
	timezone: z.string().optional(),

	// Additional metadata
	metadata: z.record(z.any()).optional(),
})

export type SearchableResource = z.infer<typeof SearchableResourceSchema>
export type SearchableParentResource = z.infer<
	typeof SearchableParentResourceSchema
>
export type SearchableTag = z.infer<typeof SearchableTagSchema>

/**
 * Schema for content transformation options
 */
export const SearchableResourceTransformOptionsSchema = z.object({
	includeEmbedding: z.boolean().default(false),
	includeTags: z.boolean().default(true),
	includeParentResources: z.boolean().default(true),
	filterByVisibility: z.array(z.string()).optional(),
	filterByState: z.array(z.string()).optional(),
})

export type ContentTransformOptions = z.infer<
	typeof SearchableResourceTransformOptionsSchema
>

/**
 * Collection schema for Typesense collection creation
 */
export const SearchCollectionSchema = z.object({
	name: z.string(),
	fields: z.array(
		z.object({
			name: z.string(),
			type: z.enum([
				'string',
				'int32',
				'int64',
				'float',
				'bool',
				'string[]',
				'int32[]',
				'int64[]',
				'float[]',
				'object',
				'object[]',
				'auto',
			]),
			facet: z.boolean().optional(),
			index: z.boolean().optional(),
			optional: z.boolean().optional(),
			sort: z.boolean().optional(),
		}),
	),
	default_sorting_field: z.string().optional(),
})

export type SearchCollectionDefinition = z.infer<typeof SearchCollectionSchema>

/**
 * Human-readable labels for searchable content attributes
 * Useful for building search UIs, facets, and filters
 */
export const searchableContentAttributeLabelMap: {
	[K in keyof SearchableResource]: string
} = {
	id: 'ID',
	title: 'Title',
	slug: 'Slug',
	description: 'Description',
	summary: 'Summary',
	type: 'Type',
	visibility: 'Visibility',
	state: 'State',
	created_at_timestamp: 'Created At',
	updated_at_timestamp: 'Updated At',
	published_at_timestamp: 'Published At',
	tags: 'Tags',
	parentResources: 'Parent Resources',
	embedding: 'Embedding',
	startsAt: 'Starts At',
	endsAt: 'Ends At',
	timezone: 'Timezone',
	metadata: 'Metadata',
} as const

/**
 * Default collection schema for content resources
 */
export const getDefaultSearchableContentCollectionSchema = (
	collectionName: string,
): SearchCollectionDefinition => ({
	name: collectionName,
	fields: [
		{ name: 'id', type: 'string', index: true },
		{ name: 'title', type: 'string', index: true, sort: true },
		{ name: 'slug', type: 'string', index: true },
		{ name: 'description', type: 'string', index: true, optional: true },
		{ name: 'summary', type: 'string', index: true, optional: true },
		{ name: 'type', type: 'string', facet: true, index: true },
		{ name: 'visibility', type: 'string', facet: true, index: true },
		{ name: 'state', type: 'string', facet: true, index: true },
		{ name: 'created_at_timestamp', type: 'int64', sort: true },
		{ name: 'updated_at_timestamp', type: 'int64', sort: true },
		{
			name: 'published_at_timestamp',
			type: 'int64',
			sort: true,
			optional: true,
		},
		{ name: 'tags', type: 'object[]', facet: true, optional: true },
		{ name: 'parentResources', type: 'object[]', optional: true },
		{ name: 'embedding', type: 'float[]', optional: true },
		{ name: 'startsAt', type: 'string', optional: true },
		{ name: 'endsAt', type: 'string', optional: true },
		{ name: 'timezone', type: 'string', optional: true },
		{ name: 'metadata', type: 'object', optional: true },
	],
	default_sorting_field: 'updated_at_timestamp',
})

/**
 * Schema for search hit results
 */
export const SearchHitSchema = z.object({
	document: z.record(z.any()),
	text_match: z.number().optional(),
	text_match_info: z.any().optional(),
})

/**
 * Schema for facet count items
 */
export const FacetCountItemSchema = z.object({
	count: z.number(),
	highlighted: z.string(),
	value: z.string(),
})

/**
 * Schema for facet counts
 */
export const FacetCountSchema = z.object({
	field_name: z.string(),
	counts: z.array(FacetCountItemSchema),
})

/**
 * Schema for search results from Typesense
 */
export const SearchResultsSchema = z.object({
	hits: z.array(SearchHitSchema),
	found: z.number(),
	out_of: z.number(),
	page: z.number(),
	request_params: z.record(z.any()),
	search_time_ms: z.number(),
	facet_counts: z.array(FacetCountSchema).optional(),
})

/**
 * Schema for collection field definition
 */
export const CollectionFieldSchema = z.object({
	name: z.string(),
	type: z.string(),
	facet: z.boolean(),
	index: z.boolean(),
	optional: z.boolean(),
})

/**
 * Schema for collection metadata from Typesense
 */
export const CollectionSchemaResponseSchema = z.object({
	name: z.string(),
	num_documents: z.number(),
	fields: z.array(CollectionFieldSchema),
	default_sorting_field: z.string(),
	created_at: z.number(),
})

export type SearchHit = z.infer<typeof SearchHitSchema>
export type FacetCountItem = z.infer<typeof FacetCountItemSchema>
export type FacetCount = z.infer<typeof FacetCountSchema>
export type SearchResults = z.infer<typeof SearchResultsSchema>
export type CollectionField = z.infer<typeof CollectionFieldSchema>
export type CollectionSchemaResponse = z.infer<
	typeof CollectionSchemaResponseSchema
>

/**
 * Schema for multi-search results from Typesense
 */
export const MultiSearchResultsSchema = z.object({
	results: z.array(SearchResultsSchema),
})

export type MultiSearchResults = z.infer<typeof MultiSearchResultsSchema>
