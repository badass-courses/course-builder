'use client'

import * as React from 'react'
import { useReducer } from 'react'
import { useRouter } from 'next/navigation'
import {
	getInitialTreeState,
	treeStateReducer,
} from '@/components/lesson-list/data/tree'
import Tree from '@/components/lesson-list/tree'
import { CreatePostForm } from '@/components/resources-crud/create-post-form'
import { addResourceToResource, createPost } from '@/lib/posts-query'
import { createResource } from '@/lib/resources/create-resources'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { CreateResourceForm } from '@coursebuilder/ui/resources-crud/create-resource-form'

export function ResourceResourcesList({
	resource,
}: {
	resource: ContentResource
}) {
	const [isAddingLesson, setIsAddingLesson] = React.useState(false)
	const [isAddingSection, setIsAddingSection] = React.useState(false)

	const initialData = [
		...(resource.resources
			? resource.resources.map((resourceItem) => {
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
		const resourceItem = await addResourceToResource({
			resource,
			resourceId: resource.id,
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
				rootResource={resource as ContentResource}
				rootResourceId={resource.id}
				state={state}
				updateState={updateState}
			/>
			<div className="flex flex-col gap-1">
				{isAddingLesson && (
					<CreatePostForm
						resourceType="post"
						onCreate={handleResourceCreated}
						createPost={createPost}
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
