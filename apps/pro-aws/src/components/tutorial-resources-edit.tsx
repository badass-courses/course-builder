'use client'

import * as React from 'react'
import { useReducer } from 'react'
import { useRouter } from 'next/navigation'
import {
	getInitialTreeState,
	treeStateReducer,
} from '@/components/lesson-list/data/tree'
import Tree from '@/components/lesson-list/tree'
import { createResource } from '@/lib/resources/create-resources'
import { addResourceToTutorial } from '@/lib/tutorials-query'

import { ContentResource } from '@coursebuilder/core/types'
import { Button } from '@coursebuilder/ui'
import { CreateResourceForm } from '@coursebuilder/ui/resources-crud/create-resource-form'

export default function TutorialResourcesEdit({
	tutorial,
}: {
	tutorial: ContentResource
}) {
	const [isAddingLesson, setIsAddingLesson] = React.useState(false)
	const [isAddingSection, setIsAddingSection] = React.useState(false)

	const initialData = [
		...(tutorial.resources
			? tutorial.resources.map((resourceItem) => {
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
		const resourceItem = await addResourceToTutorial({
			resource,
			tutorialId: tutorial.id,
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
		<div className="px-5">
			<span className="text-lg font-bold">Resources</span>
			<Tree
				rootResource={tutorial as ContentResource}
				rootResourceId={tutorial.id}
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
				<div className="flex gap-1">
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
		</div>
	)
}
