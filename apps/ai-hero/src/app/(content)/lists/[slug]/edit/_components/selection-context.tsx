import React, { createContext, useContext, useState } from 'react'
import type { TypesenseResource } from '@/lib/typesense'

type SelectionContextType = {
	selectedResources: TypesenseResource[]
	toggleSelection: (resource: TypesenseResource) => void
	clearSelection: () => void
	isSelected: (id: string) => boolean
}

const SelectionContext = createContext<SelectionContextType>({
	selectedResources: [],
	toggleSelection: () => {},
	clearSelection: () => {},
	isSelected: () => false,
})

export function SelectionProvider({ children }: { children: React.ReactNode }) {
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

	const clearSelection = () => setSelectedResources([])

	const isSelected = (id: string) =>
		selectedResources.some((item) => item.id === id)

	return (
		<SelectionContext.Provider
			value={{
				selectedResources,
				toggleSelection,
				clearSelection,
				isSelected,
			}}
		>
			{children}
		</SelectionContext.Provider>
	)
}

export const useSelection = () => useContext(SelectionContext)
