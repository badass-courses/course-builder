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

export function ListProvider({
	initialList,
	children,
}: {
	initialList: List | null
	children: React.ReactNode
}) {
	const searchParams = useSearchParams()
	const listSlug = searchParams.get('list')
	console.log({ initialList })
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
