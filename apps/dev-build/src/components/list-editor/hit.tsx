'use client'

import type { TypesenseResource } from '@/lib/typesense'

import { Checkbox, Label } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import type { TreeAction } from './lesson-list/data/tree'
import { useSelection } from './selection-context'

export default function Hit({
	hit,
}: {
	hit: TypesenseResource
	listId: string
	updateTreeState: React.ActionDispatch<[action: TreeAction]>
}) {
	const { toggleSelection, isSelected } = useSelection()

	return (
		<li
			className={cn('hover:bg-muted/50 group flex items-center gap-2 px-5', {
				'bg-muted': isSelected(hit.id),
			})}
		>
			<Checkbox
				onCheckedChange={() => toggleSelection(hit)}
				id={hit.id}
				checked={isSelected(hit.id)}
			/>
			<Label
				htmlFor={hit.id}
				className="group flex w-full flex-row items-baseline justify-between gap-2 py-2 sm:py-2.5"
			>
				<div className="flex items-center gap-2">
					<span className="py-1 pr-5 font-medium sm:truncate">{hit.title}</span>
				</div>
				<div className="text-muted-foreground fon-normal flex shrink-0 items-center gap-3 pl-7 text-xs capitalize opacity-60 sm:pl-0">
					<span>{hit.type}</span>
				</div>
			</Label>
		</li>
	)
}
