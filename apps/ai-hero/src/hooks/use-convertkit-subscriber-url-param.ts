import React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { setSubscriberIdFromUrl } from '@/lib/convertkit'

/**
 * Handles ConvertKit subscriber ID from URL parameters.
 * Extracts ck_subscriber_id from URL, sets it as a cookie, then cleans up the URL.
 * Returns a boolean indicating when the cookie is ready for dependent queries.
 *
 * @returns {boolean} cookieReady - True when the subscriber cookie has been set or no URL param exists
 */
export function useConvertkitSubscriberUrlParam(): boolean {
	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()

	const urlSubscriberId = searchParams.get('ck_subscriber_id')
	const [cookieReady, setCookieReady] = React.useState(!urlSubscriberId)

	React.useEffect(() => {
		if (urlSubscriberId && !cookieReady) {
			setSubscriberIdFromUrl(urlSubscriberId).then(() => {
				// Mark cookie as ready so dependent queries can run
				setCookieReady(true)

				// Clean up URL using Next router
				const params = new URLSearchParams(searchParams.toString())
				params.delete('ck_subscriber_id')
				const newUrl = params.toString() ? `${pathname}?${params}` : pathname
				router.replace(newUrl, { scroll: false })
			})
		}
	}, [urlSubscriberId, cookieReady, searchParams, pathname, router])

	return cookieReady
}
