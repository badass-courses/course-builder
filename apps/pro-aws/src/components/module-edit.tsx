'use client'

import * as React from 'react'
import { useReducer } from 'react'
import { useRouter } from 'next/navigation'
import {
	getInitialTreeState,
	treeStateReducer,
} from '@/components/lesson-list/data/tree'
import Tree from '@/components/lesson-list/tree'
import { CreateResourceForm } from '@/components/resources-crud/create-resource-form'
import { addResourceToTutorial } from '@/lib/tutorials-query'

import {
	ContentResource,
	ContentResourceResource,
} from '@coursebuilder/core/types'
import { Button } from '@coursebuilder/ui'

export default function Component({ tutorial }: { tutorial: ContentResource }) {
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
		<div key="1" className="grid grid-cols-8 gap-4 p-4">
			<div className="col-span-2">
				<h1 className="text-2xl font-bold">{tutorial.fields?.title}</h1>
				{tutorial.fields?.description && (
					<p className="my-2 text-sm">{tutorial.fields?.description}</p>
				)}
				<div className="space-y-2">
					{isAddingLesson && (
						<CreateResourceForm
							resourceType={'lesson'}
							onCreate={handleResourceCreated}
						/>
					)}
					{isAddingSection && (
						<CreateResourceForm
							resourceType={'section'}
							onCreate={handleResourceCreated}
						/>
					)}
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
				<div className="flex flex-col">
					<Tree
						rootResource={tutorial}
						rootResourceId={tutorial.id}
						state={state}
						updateState={updateState}
					/>
				</div>
			</div>
		</div>
	)
}
