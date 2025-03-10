'use server'

import { sanityWriteClient } from '@/server/sanity-write-client'

import type { SanitySoftwareLibraryDocument } from './types'

/**
 * Gets a Sanity software library document for a slug
 * @param librarySlug - The slug of the software library
 * @returns The Sanity software library document, or null if not found
 */
export async function getSanitySoftwareLibrary(
	librarySlug: string,
): Promise<SanitySoftwareLibraryDocument | null> {
	if (!librarySlug) return null

	const sanitySoftwareLibrary = await sanityWriteClient.fetch(
		`*[_type == "software-library" && slug.current == $librarySlug][0]`,
		{ librarySlug },
	)

	if (!sanitySoftwareLibrary) {
		return null
	}

	return sanitySoftwareLibrary
}
