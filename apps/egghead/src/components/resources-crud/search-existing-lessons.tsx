'use client'

import * as React from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { searchLessons } from '@/lib/posts-query'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
} from '@coursebuilder/ui'

type SearchExistingLessonsProps = {
	onSelect: (resource: ContentResource) => void
	onCancel: () => void
	existingResourceIds: string[]
	latestLessonsLoader?: Promise<ContentResource[]>
}

export function SearchExistingLessons({
	onSelect,
	onCancel,
	existingResourceIds,
	latestLessonsLoader,
}: SearchExistingLessonsProps) {
	const [searchTerm, setSearchTerm] = React.useState('')
	const [results, setResults] = React.useState<ContentResource[]>([])
	const [isSearching, setIsSearching] = React.useState(false)
	const [preloadedLessons, setPreloadedLessons] = React.useState<
		ContentResource[]
	>([])
	const [isLoadingPreloaded, setIsLoadingPreloaded] = React.useState(false)
	const debouncedSearchTerm = useDebounce(searchTerm, 300)

	// Load preloaded lessons when component mounts
	React.useEffect(() => {
		async function loadPreloadedLessons() {
			if (!latestLessonsLoader) return

			setIsLoadingPreloaded(true)
			try {
				const lessons = await latestLessonsLoader
				const filteredLessons = lessons.filter(
					(lesson) => !existingResourceIds.includes(lesson.id),
				)
				setPreloadedLessons(filteredLessons)
			} catch (error) {
				console.error('Error loading preloaded lessons:', error)
			} finally {
				setIsLoadingPreloaded(false)
			}
		}

		loadPreloadedLessons()
	}, [latestLessonsLoader, existingResourceIds])

	React.useEffect(() => {
		async function search() {
			if (!debouncedSearchTerm) {
				setResults([])
				return
			}

			setIsSearching(true)
			try {
				const searchResults = await searchLessons(debouncedSearchTerm)
				const filteredResults = searchResults.filter(
					(result) => !existingResourceIds.includes(result.id),
				)
				setResults(filteredResults)
			} catch (error) {
				console.error('Search error:', error)
				setResults([])
			} finally {
				setIsSearching(false)
			}
		}

		search()
	}, [debouncedSearchTerm, existingResourceIds])

	// Determine what to display
	const displayItems = searchTerm.length >= 2 ? results : preloadedLessons
	const isLoading = searchTerm.length >= 2 ? isSearching : isLoadingPreloaded
	const showNoResults =
		searchTerm.length >= 2 && !isSearching && results.length === 0

	return (
		<div className="w-full space-y-2 px-5">
			<div className="bg-background rounded-md border">
				<Command>
					<CommandInput
						placeholder="Search for lessons..."
						value={searchTerm}
						onValueChange={setSearchTerm}
						autoFocus
					/>
					<div className="max-h-[300px] overflow-auto">
						{isLoading ? (
							<div className="text-muted-foreground px-3 py-2 text-sm">
								{isSearching ? 'Searching...' : 'Loading recent lessons...'}
							</div>
						) : showNoResults ? (
							<div className="text-muted-foreground px-3 py-2 text-sm">
								No lessons found
							</div>
						) : displayItems.length > 0 ? (
							<>
								{!searchTerm && (
									<div className="text-muted-foreground px-3 py-1 text-xs font-medium">
										Recent Lessons
									</div>
								)}
								<CommandGroup>
									{displayItems.map((item) => {
										const title = item.fields?.title || 'Untitled'
										// Remove quotes to prevent CSS selector issues
										const sanitizedValue = title.replace(/['"]/g, '')
										return (
											<CommandItem
												key={item.id}
												value={sanitizedValue}
												onSelect={() => {
													onSelect(item)
												}}
												className="cursor-pointer"
											>
												{title}
											</CommandItem>
										)
									})}
								</CommandGroup>
							</>
						) : (
							!searchTerm && (
								<div className="text-muted-foreground px-3 py-2 text-sm">
									No recent lessons available
								</div>
							)
						)}
					</div>
				</Command>
			</div>
			<div className="flex justify-end">
				<Button onClick={onCancel} variant="outline" size="sm">
					Cancel
				</Button>
			</div>
		</div>
	)
}
