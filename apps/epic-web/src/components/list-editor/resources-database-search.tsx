'use client'

import React from 'react'
import Spinner from '@/components/spinner'
import { addPostToList } from '@/lib/lists-query'
import { getResourcesCount, searchResources } from '@/lib/resources-query'
import { Search } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button, DialogTrigger, Input } from '@coursebuilder/ui'

import Hit from './hit'
import type { TreeAction } from './lesson-list/data/tree'
import { useSelection } from './selection-context'

type ResourceResult = {
	id: string
	title: string
	type: string
	slug: string
	description: string
	visibility: string
	state: string
}

/**
 * Database-backed resource search component
 * Replaces Typesense search when Typesense is not available
 */
export function ResourcesDatabaseSearch({
	list,
	updateTreeState,
	availableTypes = [
		'post',
		'article',
		'tip',
		'lesson',
		'section',
		'list',
		'workshop',
		'videoResource',
	],
}: {
	list: ContentResource
	updateTreeState: React.ActionDispatch<[action: TreeAction]>
	availableTypes?: string[]
}) {
	const [query, setQuery] = React.useState('')
	const [items, setItems] = React.useState<ResourceResult[]>([])
	const [isLoading, setIsLoading] = React.useState(false)
	const [hasMore, setHasMore] = React.useState(false)
	const [offset, setOffset] = React.useState(0)
	const [totalCount, setTotalCount] = React.useState(0)

	const {
		selectedResources,
		clearSelection,
		setIsLoading: setSelectionLoading,
		isLoading: isSelectionLoading,
		setExcludedIds,
		excludedIds,
	} = useSelection()

	// Debounce timer ref
	const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

	// Search function
	const performSearch = React.useCallback(
		async (searchQuery: string) => {
			setIsLoading(true)
			setOffset(0)
			try {
				const [results, count] = await Promise.all([
					searchResources({
						query: searchQuery,
						types: availableTypes,
						excludedIds,
						limit: 20,
						offset: 0,
					}),
					getResourcesCount({
						query: searchQuery,
						types: availableTypes,
						excludedIds,
					}),
				])

				setItems(results)
				setTotalCount(count)
				setHasMore(results.length < count)
				console.log('📊 Database Search Results:', {
					query: searchQuery,
					resultsCount: results.length,
					totalCount: count,
					excludedIdsCount: excludedIds.length,
				})
			} catch (error) {
				console.error('❌ Database search error:', error)
				setItems([])
				setTotalCount(0)
				setHasMore(false)
			} finally {
				setIsLoading(false)
			}
		},
		[availableTypes, excludedIds],
	)

	// Debounced search function
	const debouncedSearch = React.useCallback(
		(searchQuery: string) => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}
			searchTimeoutRef.current = setTimeout(() => {
				performSearch(searchQuery)
			}, 300)
		},
		[performSearch],
	)

	// Initial load and when excludedIds change
	React.useEffect(() => {
		performSearch(query)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [excludedIds.join(',')])

	// Cleanup timeout on unmount
	React.useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current)
			}
		}
	}, [])

	// Load more function
	const loadMore = React.useCallback(async () => {
		if (isLoading || !hasMore) return

		setIsLoading(true)
		const newOffset = offset + 20
		try {
			const results = await searchResources({
				query,
				types: availableTypes,
				excludedIds,
				limit: 20,
				offset: newOffset,
			})

			setItems((prev) => [...prev, ...results])
			setOffset(newOffset)
			setHasMore(
				results.length === 20 && newOffset + results.length < totalCount,
			)
		} catch (error) {
			console.error('❌ Load more error:', error)
		} finally {
			setIsLoading(false)
		}
	}, [
		query,
		availableTypes,
		excludedIds,
		offset,
		totalCount,
		hasMore,
		isLoading,
	])

	const handleBulkAdd = async () => {
		// update the tree state right away
		setExcludedIds((prev) => [...prev, ...selectedResources.map((r) => r.id)])

		for (const resource of selectedResources) {
			updateTreeState({
				type: 'add-item',
				itemId: resource.id,
				item: {
					id: resource.id,
					label: resource.title,
					type: resource.type,
					children: [],
					tier: 'standard',
					itemData: {
						resourceId: resource.id,
						resourceOfId: list.id,
						position: 0,
						metadata: {
							tier: 'standard',
						},
						resource: {
							id: resource.id,
							fields: {
								title: resource.title,
								slug: resource.slug ?? '',
								description: resource.description ?? '',
								visibility: resource.visibility ?? 'unlisted',
								state: resource.state ?? 'draft',
							},
						} as any,
					},
				},
			})
		}
		// then await the API calls
		for (const resource of selectedResources) {
			setSelectionLoading(true)
			await addPostToList({
				postId: resource.id,
				listId: list.id,
				metadata: {
					tier: 'standard',
				},
			})
		}
		clearSelection()
		setSelectionLoading(false)
		// Refresh search to update excluded IDs
		performSearch(query)
	}

	return (
		<div>
			<div className="bg-background sticky top-0 flex min-h-[57px] items-center justify-between px-5 py-2">
				{selectedResources.length > 0 ? (
					<>
						<span>{selectedResources.length} selected</span>
						{isSelectionLoading ? (
							<Spinner className="h-4 w-4" />
						) : (
							<div className="flex gap-2">
								<Button variant="ghost" onClick={clearSelection}>
									Cancel
								</Button>
								<DialogTrigger asChild>
									<Button onClick={handleBulkAdd}>Add Selected</Button>
								</DialogTrigger>
							</div>
						)}
					</>
				) : (
					<span className="text-lg font-bold">Add to list</span>
				)}
			</div>
			<div className="border-b px-5 pb-4">
				<div className="relative">
					<Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
					<Input
						type="search"
						placeholder="Search resources..."
						value={query}
						onChange={(e) => {
							setQuery(e.target.value)
							debouncedSearch(e.target.value)
						}}
						className="pl-9"
					/>
				</div>
			</div>
			{isLoading && offset === 0 ? (
				<div className="flex items-center justify-center py-8">
					<Spinner className="h-6 w-6" />
					<span className="text-muted-foreground ml-2 text-sm">Loading...</span>
				</div>
			) : items.length === 0 ? (
				<div className="px-5 py-8 text-center">
					<p className="text-muted-foreground text-sm">
						No resources found. Try adjusting your search or filters.
					</p>
				</div>
			) : (
				<>
					<ul className="divide-y">
						{items.map((item) => (
							<Hit
								key={item.id}
								updateTreeState={updateTreeState}
								listId={list.id}
								hit={item as any}
							/>
						))}
					</ul>
					{hasMore && (
						<div className="flex justify-center p-4">
							<Button
								variant="ghost"
								onClick={loadMore}
								disabled={isLoading}
								className="font-semibold"
							>
								{isLoading ? (
									<>
										<Spinner className="mr-2 h-4 w-4" />
										Loading...
									</>
								) : (
									'Show More'
								)}
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	)
}
