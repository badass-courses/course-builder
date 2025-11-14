'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import type { List } from '@/lib/lists'
import { api } from '@/trpc/react'

interface ListContextType {
	list: List | null
	isLoading: boolean
}

const ListContext = React.createContext<ListContextType>({
	list: null,
	isLoading: false,
})

/**
 * ListProvider manages the current content list state, handling both direct navigation
 * and list-based navigation via URL parameters.
 *
 * The provider handles two scenarios:
 * 1. Direct post navigation: Uses the initialList passed from the server
 * 2. List-based navigation: When ?list= parameter is present and different from initialList,
 *    it fetches the new list data
 *
 * @param initialList - The list data fetched server-side during initial page load
 * @param children - React child components that will have access to list context
 */
export function ListProvider({
	initialList,
	children,
}: {
	initialList: List | null
	children: React.ReactNode
}) {
	const searchParams = useSearchParams()
	const listSlug = searchParams.get('list')

	const mismatch =
		searchParams.has('list') && listSlug !== initialList?.fields.slug

	const { data: listFromParam, isFetched: isListFetched } =
		api.contentResources.getList.useQuery(
			{ slugOrId: listSlug as string },
			{
				placeholderData: initialList as List,
				initialData: initialList as List,
				enabled: mismatch,
			},
		)

	const list = mismatch ? listFromParam : initialList
	const isLoading = !isListFetched && mismatch

	return (
		<ListContext.Provider value={{ list, isLoading }}>
			{children}
		</ListContext.Provider>
	)
}

export function useList() {
	return React.useContext(ListContext)
}
