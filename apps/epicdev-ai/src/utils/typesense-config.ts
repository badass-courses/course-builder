/**
 * Typesense collection name configuration
 * This file must NOT import from any packages that use dynamic code eval
 * to avoid Edge Runtime issues in middleware
 */
export const TYPESENSE_COLLECTION_NAME =
	process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME ?? 'content_production'
