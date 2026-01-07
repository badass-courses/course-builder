'use client'

import type { TypesenseResource } from '@/lib/typesense'

import { Checkbox, Label } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import type { TreeAction } from './lesson-list/data/tree'
import { useSelection } from './selection-context'

export default function Hit({
	hit,
}: {
	hit: TypesenseResource | { id: string; title: string; type: string }
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
				className="group flex w-full flex-row items-center justify-between gap-4 py-2 sm:py-2.5"
			>
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<span className="font-medium">{hit.title}</span>
				</div>
				<div className="text-muted-foreground flex flex-shrink-0 items-center text-xs font-medium capitalize opacity-70">
					<span className="whitespace-nowrap">{hit.type}</span>
				</div>
			</Label>
		</li>
	)
}
