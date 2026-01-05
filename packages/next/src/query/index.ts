// Cache utilities
export {
	createCachedQuery,
	cacheQuery,
	type CachedQueryOptions,
} from './cache.js'

// Parsing utilities
export {
	parseWithSchema,
	parseArrayWithSchema,
	parseOrDefault,
	type ParseOptions,
} from './parsing.js'

// Revalidation utilities
export {
	revalidateTag,
	withRevalidation,
	revalidateTags,
	revalidatePaths,
	createRevalidationConfig,
	type RevalidationOptions,
} from './revalidation.js'

// Lookup utilities
export {
	createSlugOrIdWhere,
	createContentFilters,
	getContentAccessFilters,
	type SlugOrIdWhereOptions,
	type ContentFilterOptions,
} from './lookup.js'

// Authorization utilities
export {
	createAuthConfig,
	withAuthorization,
	withResourceAuthorization,
	requireAuth,
	type AuthConfig,
	type AuthCheckOptions,
	type AuthContext,
	type AuthResult,
	type AuthSession,
	type Ability,
	type AuthLogger,
} from './authorization.js'

// Slug utilities
export {
	updateSlugFromTitle,
	extractGuidFromSlug,
	createSlugWithGuid,
	hasGuidInSlug,
	getUpdatedSlug,
	type UpdateSlugOptions,
	type ShouldUpdateSlugOptions,
} from './slug.js'

// Search indexing utilities
export {
	createSearchConfig,
	indexDocument,
	removeFromIndex,
	withSearchIndexing,
	createIndexedMutation,
	createIndexedDelete,
	type SearchConfig,
	type SearchAction,
	type SearchLogger,
	type IndexingOptions,
} from './search-indexing.js'
