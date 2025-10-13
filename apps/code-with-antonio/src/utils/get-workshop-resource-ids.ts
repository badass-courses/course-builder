import type { Workshop } from '@/lib/workshops'

/**
 * Recursively collects **all** `resource.id`s contained within a `Workshop`.
 *
 * This includes:
 *  • Top-level resources that belong directly to the workshop (sections, lessons, posts, etc)
 *  • Any resources nested within sections (lessons, posts, etc)
 *  • Resources nested even deeper (solutions, videoResources, …) – the recursion doesn't care.
 *
 * NOTE: The returned list **does not** include the workshop id itself, only the child resources.
 *
 * @param workshop – Fully-hydrated workshop object returned from `getWorkshop()`
 * @returns A flat array of **unique** resource ids contained in the workshop.
 */
export function getWorkshopResourceIds(
	workshop: Workshop | null | undefined,
): string[] {
	if (!workshop?.resources) return []

	const ids = new Set<string>()

	function traverse(resources: any[]) {
		for (const mapping of resources) {
			// `mapping.resourceId` is the id of the child resource in the join table
			if (typeof mapping.resourceId === 'string') {
				ids.add(mapping.resourceId)
			}

			// The actual resource object is eager-loaded in the query
			const resource = mapping.resource
			if (resource) {
				// ensure we capture the id in case it differs (paranoia)
				if (typeof resource.id === 'string') {
					ids.add(resource.id)
				}

				// Recurse if the resource also has children (e.g. section → lessons, lesson → solutions)
				if (
					Array.isArray(resource.resources) &&
					resource.resources.length > 0
				) {
					traverse(resource.resources)
				}
			}
		}
	}

	traverse(workshop.resources)

	return Array.from(ids)
}
