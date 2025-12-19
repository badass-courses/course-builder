import React, { createContext, useContext, useState } from 'react'
import type { TypesenseResource } from '@/lib/typesense'

import type { ContentResource } from '@coursebuilder/core/schemas'

type SelectionContextType = {
	selectedResources: TypesenseResource[]
	toggleSelection: (resource: TypesenseResource) => void
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
	const [selectedResources, setSelectedResources] = useState<
		TypesenseResource[]
	>([])

	const toggleSelection = (resource: TypesenseResource) => {
		setSelectedResources((current) =>
			current.some((item) => item.id === resource.id)
				? current.filter((item) => item.id !== resource.id)
				: [...current, resource],
		)
	}
	const initialExcludedIds =
		list?.resources?.map((r) => r.resource.id).filter(Boolean) ?? []

	const [excludedIds, setExcludedIds] =
		React.useState<string[]>(initialExcludedIds)

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
