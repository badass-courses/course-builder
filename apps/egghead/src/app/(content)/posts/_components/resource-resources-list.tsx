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
import { SearchExistingLessons } from '@/components/resources-crud/search-existing-lessons'
import { addResourceToResource, createPost } from '@/lib/posts-query'
import { createResource } from '@/lib/resources/create-resources'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { CreateResourceForm } from '@coursebuilder/ui/resources-crud/create-resource-form'

type FormState = {
	activeForm: 'lesson' | 'section' | 'existing_lesson' | null
}

type FormAction =
	| { type: 'SHOW_LESSON_FORM' }
	| { type: 'SHOW_SECTION_FORM' }
	| { type: 'SHOW_EXISTING_LESSON_FORM' }
	| { type: 'HIDE_FORM' }

function formReducer(state: FormState, action: FormAction): FormState {
	switch (action.type) {
		case 'SHOW_LESSON_FORM':
			return { activeForm: 'lesson' }
		case 'SHOW_SECTION_FORM':
			return { activeForm: 'section' }
		case 'SHOW_EXISTING_LESSON_FORM':
			return { activeForm: 'existing_lesson' }
		case 'HIDE_FORM':
			return { activeForm: null }
		default:
			return state
	}
}

export function ResourceResourcesList({
	resource,
}: {
	resource: ContentResource
}) {
	const [formState, formDispatch] = useReducer(formReducer, {
		activeForm: null,
	})

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

	const handleResourceCreated = async (createdResource: ContentResource) => {
		const resourceItem = await addResourceToResource({
			resource: createdResource,
			parentResourceId: resource.id,
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

		formDispatch({ type: 'HIDE_FORM' })
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
				{formState.activeForm === 'lesson' && (
					<CreatePostForm
						resourceType="post"
						onCreate={handleResourceCreated}
						createPost={createPost}
						restrictToPostType="lesson"
						onCancel={() => formDispatch({ type: 'HIDE_FORM' })}
					/>
				)}
				{formState.activeForm === 'existing_lesson' && (
					<SearchExistingLessons
						onSelect={handleResourceCreated}
						onCancel={() => formDispatch({ type: 'HIDE_FORM' })}
					/>
				)}
				<div className="flex gap-1 px-5">
					<Button
						onClick={() => formDispatch({ type: 'SHOW_LESSON_FORM' })}
						className="mt-2"
						variant="outline"
					>
						+ add a lesson
					</Button>
					<Button
						onClick={() => formDispatch({ type: 'SHOW_EXISTING_LESSON_FORM' })}
						className="mt-2"
						variant="outline"
					>
						+ add existing lesson
					</Button>
				</div>
			</div>
		</>
	)
}
