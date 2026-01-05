'use server'

import { eq, or, sql, type Column, type SQL } from 'drizzle-orm'

/**
 * Options for creating slug or ID where clause
 */
export interface SlugOrIdWhereOptions {
	/** The slug or ID to look up */
	slugOrId: string
	/** The table to query (must have `id` and `fields` columns) */
	table: {
		id: Column
		fields: Column
	}
	/** Resource type prefix (e.g., 'post', 'lesson', 'list') */
	resourceType?: string
	/** Additional resource type prefixes to check (e.g., ['list'] for post-or-list lookups) */
	additionalTypes?: string[]
}

/**
 * Creates a Drizzle where clause for looking up content by slug or ID.
 * Handles the common pattern of:
 * - Exact slug match via JSON_EXTRACT
 * - Exact ID match
 * - ID match from slug's GUID portion (e.g., 'my-post~abc123' → 'post_abc123')
 *
 * @example
 * ```ts
 * const post = await db.query.contentResource.findFirst({
 *   where: and(
 *     createSlugOrIdWhere({
 *       slugOrId: 'my-post~abc123',
 *       table: contentResource,
 *       resourceType: 'post',
 *     }),
 *     eq(contentResource.type, 'post'),
 *   ),
 * })
 * ```
 */
export function createSlugOrIdWhere(options: SlugOrIdWhereOptions): SQL {
	const { slugOrId, table, resourceType, additionalTypes = [] } = options

	const conditions: SQL[] = [
		// Match by slug in JSON fields
		eq(sql`JSON_EXTRACT (${table.fields}, "$.slug")`, slugOrId),
		// Match by exact ID
		eq(table.id, slugOrId),
	]

	// Extract GUID from slug if present (e.g., 'my-post~abc123' → 'abc123')
	const slugParts = slugOrId.split('~')
	if (slugParts.length > 1 && slugParts[1]) {
		const guidPart = slugParts[1]

		// Add ID match for primary resource type
		if (resourceType) {
			conditions.push(eq(table.id, `${resourceType}_${guidPart}`))
		}

		// Add ID matches for additional types
		for (const type of additionalTypes) {
			conditions.push(eq(table.id, `${type}_${guidPart}`))
		}
	}

	return or(...conditions)!
}

/**
 * Options for visibility/state filtering
 */
export interface ContentFilterOptions {
	/** The table with fields column */
	table: {
		fields: Column
	}
	/** Visibility values to allow */
	visibility?: ('public' | 'private' | 'unlisted')[]
	/** State values to allow */
	states?: ('draft' | 'published' | 'archived')[]
}

/**
 * Creates visibility and state filter conditions for content queries.
 * Returns an array of SQL conditions to use with `and()`.
 *
 * @example
 * ```ts
 * const filters = createContentFilters({
 *   table: contentResource,
 *   visibility: ['public', 'unlisted'],
 *   states: ['published'],
 * })
 *
 * const post = await db.query.contentResource.findFirst({
 *   where: and(
 *     createSlugOrIdWhere({ ... }),
 *     ...filters,
 *   ),
 * })
 * ```
 */
export function createContentFilters(options: ContentFilterOptions): SQL[] {
	const { table, visibility, states } = options
	const conditions: SQL[] = []

	if (visibility && visibility.length > 0) {
		conditions.push(
			sql`JSON_EXTRACT (${table.fields}, "$.visibility") IN (${sql.join(
				visibility.map((v) => sql`${v}`),
				sql`, `,
			)})`,
		)
	}

	if (states && states.length > 0) {
		conditions.push(
			sql`JSON_EXTRACT (${table.fields}, "$.state") IN (${sql.join(
				states.map((s) => sql`${s}`),
				sql`, `,
			)})`,
		)
	}

	return conditions
}

/**
 * Gets visibility and state arrays based on user ability.
 * Admins/editors see all content; others see only public/published.
 *
 * @example
 * ```ts
 * const { session, ability } = await getServerAuthSession()
 * const { visibility, states } = getContentAccessFilters(ability.can('update', 'Content'))
 * ```
 */
export function getContentAccessFilters(canEdit: boolean): {
	visibility: ('public' | 'private' | 'unlisted')[]
	states: ('draft' | 'published')[]
} {
	return {
		visibility: canEdit
			? ['public', 'private', 'unlisted']
			: ['public', 'unlisted'],
		states: canEdit ? ['draft', 'published'] : ['published'],
	}
}
