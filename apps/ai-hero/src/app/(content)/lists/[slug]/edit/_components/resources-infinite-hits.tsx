'use client'

import { SearchBox } from '@/app/(search)/q/_components/instantsearch/searchbox'
import type { List } from '@/lib/lists'
import { addPostToList } from '@/lib/lists-query'
import type { TypesenseResource } from '@/lib/typesense'
import { useInfiniteHits } from 'react-instantsearch'
import { z } from 'zod'

import { Button } from '@coursebuilder/ui'

import Hit from './hit'
import type { TreeAction } from './lesson-list/data/tree'
import { useSelection } from './selection-context'

export function ResourcesInfiniteHits({
	list,
	updateTreeState,
}: {
	list: List
	updateTreeState: React.ActionDispatch<[action: TreeAction]>
}) {
	const { items, showMore, isLastPage } = useInfiniteHits<TypesenseResource>({})
	const { selectedResources, clearSelection } = useSelection()

	const handleBulkAdd = async () => {
		for (const resource of selectedResources) {
			updateTreeState({
				type: 'add-item',
				itemId: resource.id,
				item: {
					id: resource.id,
					label: resource.title,
					type: resource.type,
					children: [],
					itemData: resource as any,
				},
			})

			await addPostToList({
				postId: resource.id,
				listId: list.id,
			})
		}
		clearSelection()
	}

	return (
		<div>
			<div className="bg-background sticky top-0 z-10 flex min-h-[57px] items-center justify-between px-5 py-2">
				{selectedResources.length > 0 ? (
					<>
						<span>{selectedResources.length} selected</span>
						<div className="flex gap-2">
							<Button variant="ghost" onClick={clearSelection}>
								Cancel
							</Button>
							<Button onClick={handleBulkAdd}>Add Selected</Button>
						</div>
					</>
				) : (
					<span className="text-lg font-bold">Add to list</span>
				)}
			</div>
			<div className="border-b px-5 pb-4">
				<SearchBox className="mb-0 mt-1" />
			</div>
			<ul className="divide-y">
				{items
					.filter(
						(item) =>
							!list.resources.find(
								(r) => r.resource.fields?.slug === item.slug,
							),
					)
					.map((item) => (
						<Hit
							key={item.objectID}
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
