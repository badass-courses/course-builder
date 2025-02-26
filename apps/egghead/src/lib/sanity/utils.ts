import type { SanityReference } from './types'

/**
 * Generates a random key for Sanity references
 * @returns A random hexadecimal string of 12 characters
 */
export const keyGenerator = (): string => {
	return [...Array(12)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join('')
}

/**
 * Creates a Sanity reference object with a random key
 * @param documentId - The ID of the document to reference
 * @returns A Sanity reference object
 */
export function createSanityReference(documentId: string): SanityReference {
	return {
		_type: 'reference',
		_key: keyGenerator(),
		_ref: documentId,
	}
}
