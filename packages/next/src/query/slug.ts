import slugify from '@sindresorhus/slugify'

/**
 * Options for updating a slug from title
 */
export interface UpdateSlugOptions {
	/** Current slug (may include GUID, e.g., 'my-post~abc123') */
	currentSlug: string
	/** Current title */
	currentTitle: string
	/** New title to generate slug from */
	newTitle: string
	/** Fallback GUID generator if slug doesn't contain one */
	guidGenerator?: () => string
}

/**
 * Updates a slug when the title changes, preserving the GUID portion.
 * Course Builder uses slugs in the format 'title-slug~guid' to ensure uniqueness.
 *
 * @example
 * ```ts
 * const newSlug = updateSlugFromTitle({
 *   currentSlug: 'old-title~abc123',
 *   currentTitle: 'Old Title',
 *   newTitle: 'New Title',
 * })
 * // Returns: 'new-title~abc123'
 * ```
 *
 * @example
 * ```ts
 * // With custom GUID generator
 * const newSlug = updateSlugFromTitle({
 *   currentSlug: 'old-title',  // No GUID in slug
 *   currentTitle: 'Old Title',
 *   newTitle: 'New Title',
 *   guidGenerator: () => guid(),
 * })
 * // Returns: 'new-title~<new-guid>'
 * ```
 */
export function updateSlugFromTitle(options: UpdateSlugOptions): string {
	const { currentSlug, currentTitle, newTitle, guidGenerator } = options

	// If title hasn't changed, keep current slug
	if (currentTitle === newTitle) {
		return currentSlug
	}

	// Extract GUID from current slug (format: 'title~guid')
	const slugParts = currentSlug.split('~')
	const guidPart = slugParts[1] || guidGenerator?.() || ''

	// Generate new slug from title
	const newSlugBase = slugify(newTitle)

	// Return with GUID if we have one
	return guidPart ? `${newSlugBase}~${guidPart}` : newSlugBase
}

/**
 * Extracts the GUID portion from a slug.
 * Returns undefined if slug doesn't contain a GUID separator.
 *
 * @example
 * ```ts
 * extractGuidFromSlug('my-post~abc123') // 'abc123'
 * extractGuidFromSlug('my-post') // undefined
 * ```
 */
export function extractGuidFromSlug(slug: string): string | undefined {
	const parts = slug.split('~')
	return parts.length > 1 ? parts[1] : undefined
}

/**
 * Creates a slug with GUID from a title.
 *
 * @example
 * ```ts
 * const slug = createSlugWithGuid('My Post Title', 'abc123')
 * // Returns: 'my-post-title~abc123'
 * ```
 */
export function createSlugWithGuid(title: string, guid: string): string {
	return `${slugify(title)}~${guid}`
}

/**
 * Checks if a slug contains a GUID portion.
 *
 * @example
 * ```ts
 * hasGuidInSlug('my-post~abc123') // true
 * hasGuidInSlug('my-post') // false
 * ```
 */
export function hasGuidInSlug(slug: string): boolean {
	return slug.includes('~') && slug.split('~').length === 2
}

/**
 * Options for checking if slug needs update
 */
export interface ShouldUpdateSlugOptions {
	/** Current slug */
	currentSlug: string
	/** New slug from input (may be manually set) */
	inputSlug: string
	/** Current title */
	currentTitle: string
	/** New title */
	newTitle: string
}

/**
 * Determines if a slug needs to be updated based on title and input changes.
 * Returns the appropriate slug value.
 *
 * Rules:
 * 1. If title changed and slug contains GUID, auto-update slug preserving GUID
 * 2. If input slug differs from current (manual override), use input slug
 * 3. Otherwise, keep current slug
 *
 * @example
 * ```ts
 * const newSlug = getUpdatedSlug({
 *   currentSlug: 'old-title~abc123',
 *   inputSlug: 'old-title~abc123',
 *   currentTitle: 'Old Title',
 *   newTitle: 'New Title',
 * })
 * // Returns: 'new-title~abc123' (auto-updated from title)
 * ```
 */
export function getUpdatedSlug(options: ShouldUpdateSlugOptions): string {
	const { currentSlug, inputSlug, currentTitle, newTitle } = options

	// Title changed and slug has GUID - auto-update
	if (newTitle !== currentTitle && hasGuidInSlug(inputSlug)) {
		return updateSlugFromTitle({
			currentSlug,
			currentTitle,
			newTitle,
		})
	}

	// Manual slug change
	if (inputSlug !== currentSlug) {
		return inputSlug
	}

	// No change needed
	return currentSlug
}
