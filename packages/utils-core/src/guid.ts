import { customAlphabet } from 'nanoid'

/**
 * Generates a random alphanumeric identifier with 5 characters.
 * Uses lowercase letters (a-z) and numbers (0-9).
 *
 * @returns A unique 5-character string identifier
 * @example
 * const id = guid(); // Returns something like "a7b2x"
 */
export const guid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)
