import React from 'react'
import { SearchBox } from '@/app/(search)/browse/_components/instantsearch/searchbox'
import Spinner from '@/components/spinner'
import { addPostToList } from '@/lib/lists-query'
import type { TypesenseResource } from '@/lib/typesense'
import { useInfiniteHits, useInstantSearch } from 'react-instantsearch'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button, DialogTrigger } from '@coursebuilder/ui'

import Hit from './hit'
import type { TreeAction } from './lesson-list/data/tree'
import { useSelection } from './selection-context'

export function ResourcesInfiniteHits({
	list,
	updateTreeState,
}: {
	list: ContentResource
	updateTreeState: React.ActionDispatch<[action: TreeAction]>
}) {
	const { items, showMore, isLastPage } = useInfiniteHits<TypesenseResource>({})
	const { refresh } = useInstantSearch()

	const {
		selectedResources,
		clearSelection,
		setIsLoading,
		isLoading,
		setExcludedIds,
	} = useSelection()

	const handleBulkAdd = async () => {
		// update the tree state right away
		setExcludedIds((prev) => [...prev, ...selectedResources.map((r) => r.id)])

		for (const resource of selectedResources) {
			updateTreeState({
				type: 'add-item',
				itemId: resource.id,
				item: {
					id: resource.id,
					label: resource.title,
					type: resource.type,
					children: [],
					tier: 'standard',
					itemData: {
						resourceId: resource.id,
						resourceOfId: list.id,
						position: 0,
						metadata: {
							tier: 'standard',
						},

						resource: {
							...resource,
							fields: {
								...(resource as any).fields,
								visibility: resource.visibility,
								state: resource.state,
							},
						} as any,
					},
				},
			})
		}
		// then await the API calls
		for (const resource of selectedResources) {
			setIsLoading(true)
			await addPostToList({
				postId: resource.id,
				listId: list.id,
				metadata: {
					tier: 'standard',
				},
			})
		}
		clearSelection()
		refresh()
		setIsLoading(false)
	}

	return (
		<div>
			<div className="bg-background top-0 flex min-h-[57px] items-center justify-between px-5 py-2">
				{selectedResources.length > 0 ? (
					<>
						<span>{selectedResources.length} selected</span>
						{isLoading ? (
							<Spinner className="h-4 w-4" />
						) : (
							<div className="flex gap-2">
								<Button variant="ghost" onClick={clearSelection}>
									Cancel
								</Button>
								<DialogTrigger asChild>
									<Button onClick={handleBulkAdd}>Add Selected</Button>
								</DialogTrigger>
							</div>
						)}
					</>
				) : (
					<span className="text-lg font-bold">Add to list</span>
				)}
			</div>
			<div className="border-b px-5 pb-4">
				<SearchBox className="mb-0 mt-1" />
			</div>
			<ul className="flex flex-col divide-y">
				{items.map((item) => (
					<Hit
						key={item.id}
						updateTreeState={updateTreeState}
						listId={list.id}
						hit={item}
					/>
				))}
			</ul>
			{!isLastPage && (
				<Button
					variant="ghost"
					onClick={showMore}
					disabled={isLastPage}
					className="font-semibold"
				>
					Show More
				</Button>
			)}
		</div>
	)
}
