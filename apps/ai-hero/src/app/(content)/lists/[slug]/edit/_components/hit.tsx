'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addPostToList } from '@/lib/lists-query'
import type { TypesenseResource } from '@/lib/typesense'

import { Button } from '@coursebuilder/ui'

import type { TreeAction } from './lesson-list/data/tree'
import { useSelection } from './selection-context'

export default function Hit({
	hit,
	listId,
	updateTreeState,
}: {
	hit: TypesenseResource
	listId: string
	updateTreeState: React.ActionDispatch<[action: TreeAction]>
}) {
	const { toggleSelection, isSelected } = useSelection()

	return (
		<li className={`${isSelected(hit.id) ? 'bg-muted' : ''}`}>
			<button
				type="button"
				className="hover:bg-muted/50 group flex w-full flex-row items-baseline justify-between gap-2 px-5 py-3 sm:py-3"
				onClick={() => toggleSelection(hit)}
			>
				<div className="flex items-center gap-2">
					<span className="pr-5 font-medium sm:truncate">{hit.title}</span>
				</div>
				<div className="text-muted-foreground fon-normal flex flex-shrink-0 items-center gap-3 pl-7 text-xs capitalize opacity-60 sm:pl-0">
					<span>{hit.type}</span>
				</div>
			</button>
		</li>
	)
}
