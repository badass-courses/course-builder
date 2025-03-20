'use client'

import { useCallback } from 'react'
import { api } from '@/trpc/react'
import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from '@hello-pangea/dnd'
import { GripIcon, TrashIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button } from '@coursebuilder/ui/primitives/button'

type SectionResource = {
	sectionId: string
	resourceId: string
	position: number
	resource?: {
		id: string
		title: string
		type: string
	}
}

type SectionResourceManagerProps = {
	sectionId: string
	resources: SectionResource[]
	onResourceChange?: () => void
}

export function SectionResourceManager({
	sectionId,
	resources,
	onResourceChange,
}: SectionResourceManagerProps) {
	const reorderResourcesMutation =
		api.section.reorderSectionResources.useMutation({
			onSuccess: () => {
				onResourceChange?.()
			},
			onError: (error) => {
				toast.error(`Error reordering resources: ${error.message}`)
			},
		})

	const removeResourceMutation =
		api.section.removeResourceFromSection.useMutation({
			onSuccess: () => {
				toast.success('Resource removed from section')
				onResourceChange?.()
			},
			onError: (error) => {
				toast.error(`Error removing resource: ${error.message}`)
			},
		})

	const handleDragEnd = useCallback(
		(result: DropResult) => {
			const { destination, source } = result

			// Dropped outside the list or no change
			if (
				!destination ||
				(destination.droppableId === source.droppableId &&
					destination.index === source.index)
			) {
				return
			}

			const reorderedResources = Array.from(resources)
			const [movedResource] = reorderedResources.splice(source.index, 1)
			reorderedResources.splice(destination.index, 0, movedResource)

			// Send updated order to the server
			const resourceIds = reorderedResources.map(
				(resource) => resource.resourceId,
			)
			reorderResourcesMutation.mutate({
				sectionId,
				resourceIds,
			})
		},
		[resources, sectionId, reorderResourcesMutation],
	)

	const handleRemoveResource = (resourceId: string) => {
		if (
			confirm(
				'Are you sure you want to remove this resource from the section? This will not delete the resource itself.',
			)
		) {
			removeResourceMutation.mutate({
				sectionId,
				resourceId,
			})
		}
	}

	return (
		<div className="mt-2 space-y-2">
			{resources && resources.length > 0 ? (
				<DragDropContext onDragEnd={handleDragEnd}>
					<Droppable droppableId={`section-${sectionId}-resources`}>
						{(provided) => (
							<ul
								{...provided.droppableProps}
								ref={provided.innerRef}
								className="space-y-1"
							>
								{resources.map((resource, index) => (
									<Draggable
										key={resource.resourceId}
										draggableId={resource.resourceId}
										index={index}
									>
										{(provided) => (
											<li
												ref={provided.innerRef}
												{...provided.draggableProps}
												className="bg-background group flex items-center justify-between rounded-md border p-2 pl-3 text-sm"
											>
												<div className="flex items-center">
													<div
														{...provided.dragHandleProps}
														className="text-muted-foreground mr-2 cursor-grab"
													>
														<GripIcon className="h-4 w-4" />
													</div>
													<span>
														{resource.resource?.title ||
															`Resource ${index + 1}`}
													</span>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleRemoveResource(resource.resourceId)
													}
													className="opacity-0 transition-opacity group-hover:opacity-100"
												>
													<TrashIcon className="text-destructive h-3 w-3" />
													<span className="sr-only">Remove</span>
												</Button>
											</li>
										)}
									</Draggable>
								))}
								{provided.placeholder}
							</ul>
						)}
					</Droppable>
				</DragDropContext>
			) : (
				<div className="text-muted-foreground pl-3 text-sm italic">
					No resources in this section. Add resources to organize your content.
				</div>
			)}
		</div>
	)
}
