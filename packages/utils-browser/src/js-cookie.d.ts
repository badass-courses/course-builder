declare module 'js-cookie' {
	export interface CookieAttributes {
		expires?: number | Date
		path?: string
		domain?: string
		secure?: boolean
		sameSite?: 'strict' | 'lax' | 'none'
		[property: string]: any
	}

	interface CookiesStatic {
		/**
		 * Get a cookie value
		 */
		get(name: string): string | undefined

		/**
		 * Set a cookie
		 */
		set(
			name: string,
			value: string,
			options?: CookieAttributes,
		): string | undefined

		/**
		 * Remove a cookie
		 */
		remove(name: string, options?: CookieAttributes): void
	}

	const Cookies: CookiesStatic
	export default Cookies
}
