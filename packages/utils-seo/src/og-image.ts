/**
 * Generates an OpenGraph image URL for a resource using the dynamic route approach
 *
 * @param resource - The resource object containing slug and updatedAt information
 * @param baseUrl - The base URL to use (typically from environment)
 * @returns A fully-qualified URL for the OpenGraph image
 *
 * @example
 * ```ts
 * const resource = {
 *   id: '123',
 *   fields: { slug: 'my-resource' },
 *   updatedAt: new Date()
 * }
 * const url = getOGImageUrlForResource(resource, 'https://example.com')
 * // Returns: "https://example.com/api/og/my-resource?updatedAt=2023-01-01T00%3A00%3A00.000Z"
 * ```
 */
export function getOGImageUrlForResource(
	resource: {
		fields?: { slug: string }
		id: string
		updatedAt?: Date | string | null
	},
	baseUrl: string,
	dynamicRoute: boolean = true,
): string {
	const slug = resource?.fields?.slug || resource.id
	const updatedAt =
		typeof resource.updatedAt === 'string'
			? resource.updatedAt
			: resource.updatedAt?.toISOString()

	const url = dynamicRoute
		? `${baseUrl}/api/og/${encodeURIComponent(slug)}${updatedAt ? `?updatedAt=${encodeURIComponent(updatedAt)}` : ''}`
		: `${baseUrl}/api/og?resource=${resource?.fields?.slug || resource.id}${updatedAt ? `&updatedAt=${encodeURI(updatedAt)}` : ''}`

	return url
}

/**
 * Generates an OpenGraph image URL for a content resource using the path-based approach
 *
 * @param resource - The content resource object containing type and slug
 * @param baseUrl - The base URL to use (typically from environment)
 * @returns A fully-qualified URL for the OpenGraph image
 *
 * @example
 * ```ts
 * const resource = {
 *   type: 'lesson',
 *   fields: { slug: 'my-lesson' }
 * }
 * const url = getOGImageUrlForContentResource(resource, 'https://example.com')
 * // Returns: "https://example.com/lessons/my-lesson/opengraph-image"
 * ```
 */
export function getOGImageUrlForContentResource(
	resource: {
		type: string
		fields?: { slug: string }
	},
	baseUrl: string,
	pluralizeFn?: (word: string) => string,
): string {
	// Default pluralize function just adds 's', but allow injection for more sophisticated pluralization
	const pluralize = pluralizeFn || ((word: string) => `${word}s`)

	return `${baseUrl}/${pluralize(resource.type)}/${resource.fields?.slug}/opengraph-image`
}
