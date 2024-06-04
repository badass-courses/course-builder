import 'next/navigation'

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/**
 * If removeList is empty, the function removes *all* params from url.
 * @param router Next Router
 * @param removeList Array of query params to remove
 */
export const removeQueryParamsFromRouter = (
	router: AppRouterInstance,
	removeList: string[],
) => {
	if (removeList.length > 0) {
		removeList.forEach((param: string) => delete router.query[param])
	} else {
		// Remove all
		Object.keys(router.query).forEach((param) => delete router.query[param])
	}
	return router.replace(
		{
			pathname: router.pathname,
			query: router.query,
		},
		undefined,
		// Do not refresh the page
		{ shallow: true },
	)
}
