import 'next/navigation'

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export const removeQueryParamsFromRouter = (
	router: AppRouterInstance,
	pathname: string,
	searchParams: URLSearchParams,
	removeList: string[],
) => {
	const oldParams = Object.fromEntries(searchParams)
	if (removeList.length > 0) {
		removeList.forEach((param: string) => delete oldParams[param])
	} else {
		// Remove all
		Object.keys(oldParams).forEach((param) => delete oldParams[param])
	}
	const newParams = new URLSearchParams(oldParams)

	return router.replace(`${pathname}?${newParams.toString()}`, {
		scroll: false,
	})
}
