import React, { createContext, useContext, useState } from 'react'
import type { TypesenseResource } from '@/lib/typesense'

import type { ContentResource } from '@coursebuilder/core/schemas'

type ResourceItem =
	| TypesenseResource
	| {
			id: string
			title: string
			type: string
			slug?: string
			description?: string
			visibility?: string
			state?: string
	  }

type SelectionContextType = {
	selectedResources: ResourceItem[]
	toggleSelection: (resource: ResourceItem) => void
	clearSelection: () => void
	isSelected: (id: string) => boolean
	isLoading: boolean
	setIsLoading: (isLoading: boolean) => void
	setExcludedIds: React.Dispatch<React.SetStateAction<string[]>>
	excludedIds: string[]
}

const SelectionContext = createContext<SelectionContextType>({
	selectedResources: [],
	toggleSelection: () => {},
	clearSelection: () => {},
	isSelected: () => false,
	isLoading: false,
	setIsLoading: () => {},
	setExcludedIds: () => {},
	excludedIds: [],
})

export function SelectionProvider({
	children,
	list,
}: {
	children: React.ReactNode
	list: ContentResource
}) {
	const [selectedResources, setSelectedResources] = useState<ResourceItem[]>([])

	const toggleSelection = (resource: ResourceItem) => {
		setSelectedResources((current) =>
			current.some((item) => item.id === resource.id)
				? current.filter((item) => item.id !== resource.id)
				: [...current, resource],
		)
	}

	const listIdRef = React.useRef<string | null>(null)
	const initialExcludedIdsRef = React.useRef<string[]>([])

	if (listIdRef.current !== list?.id) {
		listIdRef.current = list?.id ?? null
		initialExcludedIdsRef.current =
			list?.resources?.map((r) => r?.resource?.id).filter(Boolean) ?? []
	}

	const [excludedIds, setExcludedIds] = React.useState<string[]>(
		initialExcludedIdsRef.current,
	)

	const clearSelection = () => setSelectedResources([])

	const isSelected = (id: string) =>
		selectedResources.some((item) => item.id === id)

	const [isLoading, setIsLoading] = useState(false)

	return (
		<SelectionContext.Provider
			value={{
				selectedResources,
				toggleSelection,
				clearSelection,
				isSelected,
				isLoading,
				setIsLoading,
				excludedIds,
				setExcludedIds,
			}}
		>
			{children}
		</SelectionContext.Provider>
	)
}

export const useSelection = () => useContext(SelectionContext)
