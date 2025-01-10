'use client'

import * as React from 'react'
import { useReducer } from 'react'
import { useRouter } from 'next/navigation'
import type { List } from '@/lib/lists'
import { cn } from '@/utils/cn'
import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { DynamicTitle } from './dynamic-title'
import { getInitialTreeState, treeStateReducer } from './lesson-list/data/tree'
import Tree from './lesson-list/tree'
import { ResourcesInfiniteHits } from './resources-infinite-hits'
import SearchConfig from './search-config'
import { SelectionProvider } from './selection-context'

export default function ListResourcesEdit({ list }: { list: List }) {
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

	return (
		<SelectionProvider list={list}>
			<InstantSearchNext
				searchClient={typesenseInstantsearchAdapter.searchClient}
				indexName={TYPESENSE_COLLECTION_NAME}
				routing={false}
				onStateChange={({ uiState, setUiState }) => {
					setUiState(uiState)
				}}
				initialUiState={{
					[TYPESENSE_COLLECTION_NAME]: {
						query: '',
						refinementList: {
							type: ['post'],
						},
						configure: {},
					},
				}}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				<SearchConfig />
				{/* <Configure
					filters={
						excludedIds.length
							? `type:post && ${excludedIds.map((id) => `id:!=${id}`).join(' && ')}`
							: 'type:post'
					}
				/> */}

				<div className="border-b text-sm font-medium">
					<DynamicTitle />
					<Tree
						rootResource={list as ContentResource}
						rootResourceId={list.id}
						state={state}
						updateState={updateState}
					/>
					<div className={cn('flex flex-col gap-1 border-t', {})}>
						<ResourcesInfiniteHits updateTreeState={updateState} list={list} />
					</div>
					<div className="mb-3 mt-5 flex border-t px-5 pt-3 text-lg font-bold">
						Body
					</div>
				</div>
			</InstantSearchNext>
		</SelectionProvider>
	)
}
