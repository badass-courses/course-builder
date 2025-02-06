'use client'

import * as React from 'react'
import { useReducer } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DynamicTitle } from '@/app/_components/list-editor/dynamic-title'
import {
	getInitialTreeState,
	treeStateReducer,
} from '@/app/_components/list-editor/lesson-list/data/tree'
import Tree from '@/app/_components/list-editor/lesson-list/tree'
import { ResourcesInfiniteHits } from '@/app/_components/list-editor/resources-infinite-hits'
import SearchConfig from '@/app/_components/list-editor/search-config'
import { SelectionProvider } from '@/app/_components/list-editor/selection-context'
import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { Plus } from 'lucide-react'
import { InstantSearchNext } from 'react-instantsearch-nextjs'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'

export default function ListResourcesEdit({
	list,
	searchConfig = <SearchConfig />,
}: {
	list: ContentResource
	searchConfig?: React.ReactNode
}) {
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
				{searchConfig}
				<div className="border-b text-sm font-medium">
					<div className="mb-3 flex items-center justify-between px-5 pt-3">
						<DynamicTitle />
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="outline" className="gap-1">
									<Plus className="text-primary w-4" /> Add Resources
								</Button>
							</DialogTrigger>
							<DialogContent className="w-full max-w-3xl overflow-y-auto py-5 sm:max-h-[80vh]">
								<DialogTitle className="sr-only">Add Resources</DialogTitle>
								<ResourcesInfiniteHits
									updateTreeState={updateState}
									list={list}
								/>
								<DialogFooter>
									<Button variant="outline" asChild>
										<Link href="/posts/new">Create a new post</Link>
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
					<Tree
						rootResource={list as ContentResource}
						rootResourceId={list.id}
						state={state}
						updateState={updateState}
					/>
					{/* <div className={cn('flex flex-col gap-1 border-t', {})}>
						<ResourcesInfiniteHits updateTreeState={updateState} list={list} />
					</div> */}
					<div className="mb-3 mt-5 flex border-t px-5 pt-3 text-lg font-bold">
						Body
					</div>
				</div>
			</InstantSearchNext>
		</SelectionProvider>
	)
}
