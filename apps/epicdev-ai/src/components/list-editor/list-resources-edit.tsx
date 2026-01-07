import * as React from 'react'
import { useReducer } from 'react'
import { CreatePostModal } from '@/app/(content)/posts/_components/create-post-modal'
import { addPostToList } from '@/lib/lists-query'
import { track } from '@/utils/analytics'
import {
	TYPESENSE_COLLECTION_NAME,
	typesenseInstantsearchAdapter,
} from '@/utils/typesense-instantsearch-adapter'
import { Plus, Search } from 'lucide-react'
import { useInstantSearch } from 'react-instantsearch'
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

import { DynamicTitle } from './dynamic-title'
import { getInitialTreeState, treeStateReducer } from './lesson-list/data/tree'
import Tree from './lesson-list/tree'
import {
	createListEditorConfig,
	type ListEditorConfig,
} from './list-editor-config'
import { ResourcesInfiniteHits } from './resources-infinite-hits'
import SearchConfig from './search-config'
import { SelectionProvider } from './selection-context'

/**
 * List resources editor component.
 * A powerful component for managing ordered collections of resources with features
 * like drag-and-drop reordering, tier-based organization, and resource selection.
 *
 * Features:
 * - Resource selection with type filtering
 * - Drag-and-drop reordering
 * - Tier-based organization (standard/premium)
 * - Custom search configuration
 * - Resource creation integration
 * - Nested resource support
 * - Position tracking
 *
 * @component
 * @param {Object} props - Component props
 * @param {ContentResource} props.list - The list resource being edited
 * @param {ListEditorConfig} [props.config] - Configuration for the list editor
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ListResourcesEdit
 *   list={resource}
 *   config={{
 *     selection: {
 *       availableResourceTypes: ['article'],
 *       defaultResourceType: 'article'
 *     }
 *   }}
 * />
 *
 * // Advanced usage with tier selector and custom title
 * <ListResourcesEdit
 *   list={resource}
 *   config={{
 *     title: <CustomTitle />,
 *     selection: {
 *       availableResourceTypes: ['article', 'tutorial'],
 *       showTierSelector: true,
 *       searchConfig: <CustomSearchConfig />
 *     },
 *     onResourceAdd: async (resource) => {
 *       // Custom add logic
 *     }
 *   }}
 * />
 * ```
 */
export default function ListResourcesEdit({
	list,
	config: userConfig,
}: {
	list: ContentResource
	config?: Partial<ListEditorConfig>
}) {
	const config = createListEditorConfig(userConfig || {})
	const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false)
	const [isCreatePostModalOpen, setIsCreatePostModalOpen] =
		React.useState(false)
	/**
	 * Recursively builds tree item from a resource relation
	 * Supports nested sections (sections within sections)
	 */
	const buildTreeItem = (resourceItem: any): any => {
		if (!resourceItem.resource) {
			throw new Error('resourceItem.resource is required')
		}
		const resources = resourceItem.resource.resources ?? []
		const isSection = resourceItem.resource.type === 'section'

		return {
			id: resourceItem.resource.id,
			label: resourceItem.resource.fields?.title,
			type: resourceItem.resource.type,
			isOpen: isSection && resources.length > 0,
			children: resources.map(buildTreeItem),
			itemData: resourceItem as any,
		}
	}

	const initialData = [
		...(list.resources ? list.resources.map(buildTreeItem) : []),
	]
	const [state, updateState] = useReducer(
		treeStateReducer,
		initialData,
		getInitialTreeState,
	)

	function TreeWithSearch() {
		const { refresh } = useInstantSearch()
		return (
			<Tree
				state={state}
				updateState={updateState}
				rootResourceId={list.id}
				rootResource={list}
				onRefresh={() => refresh()}
				showTierSelector={config.selection.showTierSelector}
				onResourceUpdate={config.onResourceUpdate}
			/>
		)
	}

	const handleResourceAdd = async (resource: ContentResource) => {
		track('post_created', {
			source: 'search_modal',
			resourceId: resource.id,
			resourceType: resource.type,
			listId: list.id,
		})

		// Add to database first to get accurate position
		const result = await addPostToList({
			postId: resource.id,
			listId: list.id,
			metadata: {
				tier: 'standard',
			},
		})

		if (!result) {
			throw new Error('Failed to add post to list')
		}

		// Update UI with server data
		updateState({
			type: 'add-item',
			itemId: resource.id,
			item: {
				id: resource.id,
				label: resource.fields?.title,
				type: resource.type,
				// Set isOpen to true if it's a section with children
				isOpen:
					resource.type === 'section' && (resource.resources || []).length > 0,
				children: [],
				tier: 'standard',
				itemData: {
					resourceId: resource.id,
					resourceOfId: list.id,
					position: result.position,
					metadata: {
						tier: 'standard',
					},
					resource: resource as any,
				},
			},
		})

		// Call user-provided onResourceAdd if available
		await config.onResourceAdd?.(resource)
	}

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
					[TYPESENSE_COLLECTION_NAME as string]: {
						query: '',
						refinementList: {
							type: ['post', 'lesson', 'section', 'article'],
						},
						configure: {},
					},
				}}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				{config.selection.searchConfig || <SearchConfig />}
				<div className="border-b pr-2 text-sm font-medium">
					<div className="flex items-center justify-between border-b py-3 pl-5 pr-2">
						{config.title || <DynamicTitle />}
						<div className="flex items-center gap-2">
							<Button
								className="gap-1"
								variant="outline"
								onClick={() => {
									track('create_post_button_clicked', {
										source: 'search_modal',
										listId: list.id,
									})
									setIsSearchModalOpen(false)
									setIsCreatePostModalOpen(true)
								}}
							>
								<Plus className="text-primary w-4" />
								Create New
							</Button>
							<Dialog
								open={isSearchModalOpen}
								onOpenChange={setIsSearchModalOpen}
							>
								<DialogTrigger asChild>
									<Button variant="outline" className="gap-2">
										<Search className="text-primary w-4" /> Add to list
									</Button>
								</DialogTrigger>
								<DialogContent className="w-full max-w-3xl overflow-y-auto py-5 sm:max-h-[80vh]">
									<DialogTitle className="sr-only">Add Resources</DialogTitle>
									<ResourcesInfiniteHits
										updateTreeState={updateState}
										list={list}
									/>
								</DialogContent>
							</Dialog>
						</div>
					</div>
					<TreeWithSearch />
					<div className="mb-3 mt-5 flex border-t px-5 pt-3 text-lg font-semibold">
						Body
					</div>
				</div>
			</InstantSearchNext>
			<CreatePostModal
				title={config.selection.createResourceTitle}
				open={isCreatePostModalOpen}
				onOpenChange={setIsCreatePostModalOpen}
				defaultResourceType={config.selection.defaultResourceType}
				availableResourceTypes={config.selection.availableResourceTypes}
				topLevelResourceTypes={config.selection.topLevelResourceTypes}
				onResourceCreated={handleResourceAdd}
				showTrigger={false}
			/>
		</SelectionProvider>
	)
}
