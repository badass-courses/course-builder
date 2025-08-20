/**
 * Safely joins URL paths, handling trailing and leading slashes
 * @param baseUrl - The base URL (can have trailing slash or not)
 * @param path - The path to append (can have leading slash or not)
 * @returns A properly formatted URL with no double slashes
 */
export function joinUrlPath(baseUrl: string, path: string): string {
	if (!baseUrl || !path) {
		return baseUrl || path || ''
	}

	// Remove trailing slash from base URL
	const normalizedBase = baseUrl.replace(/\/+$/, '')

	// Remove leading slash from path
	const normalizedPath = path.replace(/^\/+/, '')

	// Join with single slash
	return `${normalizedBase}/${normalizedPath}`
}
