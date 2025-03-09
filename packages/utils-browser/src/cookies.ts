import cookies from 'js-cookie'
// Import types from js-cookie
import type { CookieAttributes } from 'js-cookie'

import { isString } from '@coursebuilder/nodash'

/**
 * Browser cookie utility for managing client-side cookies
 *
 * Provides methods to get, set, and remove cookies with a consistent interface.
 * Handles JSON serialization and deserialization automatically.
 *
 * @example
 * ```ts
 * // Set a cookie
 * cookieUtil.set('user', { id: 123, name: 'John' })
 *
 * // Get a cookie
 * const user = cookieUtil.get('user') // { id: 123, name: 'John' }
 *
 * // Remove a cookie
 * cookieUtil.remove('user')
 * ```
 */
const cookieUtil = {
	/**
	 * Sets a cookie with the given name, value, and options
	 *
	 * @param name - The name of the cookie
	 * @param value - The value to store (can be any JSON-serializable value)
	 * @param options - Optional configuration for the cookie
	 * @returns The value that was set (after any transformation)
	 *
	 * @example
	 * ```ts
	 * // Set a simple string cookie
	 * cookieUtil.set('name', 'John')
	 *
	 * // Set a complex object (automatically serialized to JSON)
	 * cookieUtil.set('user', { id: 123, name: 'John' })
	 *
	 * // Set with custom options
	 * cookieUtil.set('preferences', { theme: 'dark' }, { expires: 7 })
	 * ```
	 */
	set(name: string, value: any, options: CookieAttributes = {}) {
		const use_secure_cookie =
			typeof window !== 'undefined' && window.location.protocol === 'https:'
		cookies.set(name, isString(value) ? value : JSON.stringify(value), {
			secure: use_secure_cookie,
			path: '/',
			expires: 365,
			...options,
		})
		return this.get(name)
	},

	/**
	 * Gets a cookie value by name
	 *
	 * Automatically attempts to parse JSON values.
	 *
	 * @param name - The name of the cookie to retrieve
	 * @returns The cookie value (parsed from JSON if possible)
	 *
	 * @example
	 * ```ts
	 * // Get a string cookie
	 * const name = cookieUtil.get('name') // 'John'
	 *
	 * // Get a JSON cookie (automatically parsed)
	 * const user = cookieUtil.get('user') // { id: 123, name: 'John' }
	 * ```
	 */
	get(name: string) {
		// Only attempt to access cookies in browser environment
		if (typeof window === 'undefined') return null

		const value = cookies.get(name) as string
		if (value === undefined) return null

		try {
			return JSON.parse(value)
		} catch (e) {
			return value
		}
	},

	/**
	 * Removes a cookie
	 *
	 * @param name - The name of the cookie to remove
	 * @param options - Optional configuration for removal
	 *
	 * @example
	 * ```ts
	 * // Remove a cookie
	 * cookieUtil.remove('name')
	 *
	 * // Remove with custom options
	 * cookieUtil.remove('preferences', { path: '/dashboard' })
	 * ```
	 */
	remove(name: string, options: CookieAttributes = {}) {
		cookies.remove(name, options)
	},
}

export default cookieUtil
