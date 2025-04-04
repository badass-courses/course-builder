/**
 * Utility to format resource visibility and state into a human-readable status
 */
type ResourceVisibility = 'public' | 'private' | 'unlisted' | undefined
type ResourceState = 'draft' | 'published' | 'archived' | undefined

export function getResourceStatus(
	visibility?: ResourceVisibility,
	state?: ResourceState,
): string {
	// Handle undefined cases
	if (!visibility && !state) return ''

	// Most common combinations
	if (visibility === 'public' && state === 'published') return 'published'

	// Specific combinations
	if (visibility === 'unlisted' && state === 'draft') return 'unlisted draft'
	if (visibility === 'unlisted' && state === 'published') return 'unlisted'
	if (visibility === 'unlisted' && state === 'archived')
		return 'unlisted archive'

	if (visibility === 'public' && state === 'draft') return 'public draft'
	if (visibility === 'public' && state === 'archived') return 'archived'

	if (visibility === 'private' && state === 'draft') return 'private draft'
	if (visibility === 'private' && state === 'published') return 'private'
	if (visibility === 'private' && state === 'archived') return 'private archive'

	// Fallback for any other combination
	if (visibility && state) {
		return `${visibility} ${state}`
	}

	// Return just the one that's defined
	return visibility || state || ''
}
