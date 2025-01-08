'use client'

import * as React from 'react'
import { useReducer } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBox } from '@/app/(search)/q/_components/instantsearch/searchbox'
import type { List } from '@/lib/lists'
import { addPostToList } from '@/lib/lists-query'
import { cn } from '@/utils/cn'
import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

// import { InfiniteHits } from './infinite-hits'

// import { createResource } from '@/lib/resources/create-resources'
// import { addResourceToTutorial } from '@/lib/tutorials-query'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { CreateResourceForm } from '@coursebuilder/ui/resources-crud/create-resource-form'

import { getInitialTreeState, treeStateReducer } from './lesson-list/data/tree'
import Tree from './lesson-list/tree'
import { ResourcesInfiniteHits } from './resources-infinite-hits'
import { SelectionProvider } from './selection-context'

export default function ListResourcesEdit({ list }: { list: List }) {
	const [isAddingLesson, setIsAddingLesson] = React.useState(false)
	const [isAddingSection, setIsAddingSection] = React.useState(false)

	const initialData = [
		...(list.resources
			? list.resources.map((resourceItem) => {
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

	const handleResourceAdded = async (resource: ContentResource) => {
		const resourceItem = await addPostToList({
			listId: list.id,
			postId: resource.id,
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

		router.refresh()
	}

	return (
		<div className="border-b text-sm font-medium">
			{list.resources.length > 0 && (
				<>
					<span className="mb-3 flex px-5 pt-5 text-lg font-bold">
						In the list
					</span>
					<Tree
						rootResource={list as ContentResource}
						rootResourceId={list.id}
						state={state}
						updateState={updateState}
					/>
				</>
			)}
			<div
				className={cn('flex flex-col gap-1', {
					'border-t': list.resources.length > 0,
				})}
			>
				<SelectionProvider>
					<InstantSearchNext
						searchClient={typesenseInstantsearchAdapter.searchClient}
						indexName={TYPESENSE_COLLECTION_NAME}
						routing={false}
						onStateChange={({ uiState, setUiState }) => {
							function handleRefinementListChange(
								attribute: string,
								setState: (value: any) => void,
							) {
								const refinementList =
									uiState[TYPESENSE_COLLECTION_NAME]?.refinementList?.[
										attribute
									]
								if (refinementList && refinementList.length > 0) {
									setState(refinementList)
								} else {
									setState(null)
								}
							}

							const query = uiState[TYPESENSE_COLLECTION_NAME]?.query
							// setQuery(query || null)

							// handleRefinementListChange('type', setType)
							// handleRefinementListChange('instructor_name', setInstructor)

							// IMPORTANT: always call setUiState to sync the state
							setUiState(uiState)
						}}
						initialUiState={
							{
								[TYPESENSE_COLLECTION_NAME]: {
									query: '',
									refinementList: {
										type: ['post'],

										// ...(typeof instructor === 'string' && {
										// 	instructor_name: instructor.split(','),
										// }),
									},
								},
							} as any
						}
						future={{ preserveSharedStateOnUnmount: true }}
					>
						<ResourcesInfiniteHits updateTreeState={updateState} list={list} />
					</InstantSearchNext>
				</SelectionProvider>
				{/* {isAddingLesson && (
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
				)} */}
				{/* <div className="flex gap-1">
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
				</div> */}
			</div>
			<div className="mb-3 mt-5 flex border-t px-5 pt-3 text-lg font-bold">
				Body
			</div>
		</div>
	)
}
