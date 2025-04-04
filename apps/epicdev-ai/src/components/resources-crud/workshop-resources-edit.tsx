'use client'

import * as React from 'react'
import { useReducer } from 'react'
import { useRouter } from 'next/navigation'
import {
	getInitialTreeState,
	treeStateReducer,
} from '@/components/list-editor/lesson-list/data/tree'
import Tree from '@/components/list-editor/lesson-list/tree'
import { createResource } from '@/lib/resources/create-resources'
import { addResourceToWorkshop } from '@/lib/workshops-query'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { CreateResourceForm } from '@coursebuilder/ui/resources-crud/create-resource-form'

export default function WorkshopResourcesEdit({
	workshop,
}: {
	workshop: ContentResource
}) {
	const [isAddingLesson, setIsAddingLesson] = React.useState(false)
	const [isAddingSection, setIsAddingSection] = React.useState(false)

	const initialData = [
		...(workshop.resources
			? workshop.resources.map((resourceItem) => {
					if (!resourceItem.resource) {
						throw new Error('resourceItem.resource is required')
					}
					const resources = resourceItem.resource.resources ?? []
					return {
						id: resourceItem.resource.id,
						label: resourceItem.resource.fields?.title,
						type: resourceItem.resource.type,
						children: resources.map((resourceItem: any) => {
							if (!resourceItem.resource) {
								throw new Error('resourceItem.resource is required')
							}
							return {
								id: resourceItem.resource.id,
								label: resourceItem.resource.fields?.title,
								type: resourceItem.resource.type,
								children: [],
								itemData: resourceItem as any,
							}
						}),
						itemData: resourceItem as any,
					}
				})
			: []),
	]
	const [state, updateState] = useReducer(
		treeStateReducer,
		initialData,
		getInitialTreeState,
	)
	const router = useRouter()

	const handleResourceCreated = async (resource: ContentResource) => {
		const resourceItem = await addResourceToWorkshop({
			resource,
			workshopId: workshop.id,
		})

		if (resourceItem) {
			updateState({
				type: 'add-item',
				itemId: resourceItem.resource.id,
				item: {
					id: resourceItem.resource.id,
					label: resourceItem.resource.fields?.title,
					type: resourceItem.resource.type,
					children: [],
					itemData: resourceItem as any,
				},
			})
		}

		setIsAddingSection(false)
		setIsAddingLesson(false)
		router.refresh()
	}

	return (
		<>
			<span className="px-5 text-lg font-bold">Resources</span>
			<Tree
				rootResource={workshop as ContentResource}
				rootResourceId={workshop.id}
				state={state}
				updateState={updateState}
			/>
			<div className="flex flex-col gap-1">
				{isAddingLesson && (
					<CreateResourceForm
						resourceType={'lesson'}
						onCreate={handleResourceCreated}
						createResource={createResource}
					/>
				)}
				{isAddingSection && (
					<CreateResourceForm
						resourceType={'section'}
						onCreate={handleResourceCreated}
						createResource={createResource}
					/>
				)}
				<div className="flex gap-1 px-5">
					<Button
						onClick={() => setIsAddingLesson(true)}
						className="mt-2"
						variant="outline"
					>
						+ add a lesson
					</Button>
					<Button
						onClick={() => setIsAddingSection(true)}
						className="mt-2"
						variant="outline"
					>
						+ add section
					</Button>
				</div>
			</div>
		</>
	)
}
