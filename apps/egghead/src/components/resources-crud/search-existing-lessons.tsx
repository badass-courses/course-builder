'use client'

import * as React from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { searchLessons } from '@/lib/posts-query'
import { ChevronsUpDown } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@coursebuilder/ui'

type SearchExistingLessonsProps = {
	onSelect: (resource: ContentResource) => void
	onCancel: () => void
}

export function SearchExistingLessons({
	onSelect,
	onCancel,
}: SearchExistingLessonsProps) {
	const [open, setOpen] = React.useState(false)
	const [searchTerm, setSearchTerm] = React.useState('')
	const [results, setResults] = React.useState<ContentResource[]>([])
	const [isSearching, setIsSearching] = React.useState(false)
	const debouncedSearchTerm = useDebounce(searchTerm, 300)

	React.useEffect(() => {
		async function search() {
			if (!debouncedSearchTerm) {
				setResults([])
				return
			}

			setIsSearching(true)
			try {
				const searchResults = await searchLessons(debouncedSearchTerm)
				setResults(searchResults)
			} catch (error) {
				console.error('Search error:', error)
				setResults([])
			} finally {
				setIsSearching(false)
			}
		}

		search()
	}, [debouncedSearchTerm])

	return (
		<div className="w-full space-y-4">
			<div className="flex justify-between">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							className="w-[300px] justify-between"
						>
							Search lessons...
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[300px] p-0">
						<Command>
							<CommandInput
								placeholder="Search lessons..."
								value={searchTerm}
								onValueChange={setSearchTerm}
							/>
							{isSearching ? (
								<div className="text-muted-foreground px-3 py-2 text-sm">
									Searching...
								</div>
							) : results.length > 0 ? (
								<CommandGroup className="max-h-64 overflow-auto">
									{results.map((result) => (
										<CommandItem
											key={result.id}
											onSelect={() => {
												onSelect(result)
												setOpen(false)
											}}
										>
											{result.fields?.title || 'Untitled'}
										</CommandItem>
									))}
								</CommandGroup>
							) : searchTerm.length >= 2 ? (
								<div className="text-muted-foreground px-3 py-2 text-sm">
									No lessons found
								</div>
							) : null}
						</Command>
					</PopoverContent>
				</Popover>
				<Button onClick={onCancel} variant="outline" size="sm">
					Cancel
				</Button>
			</div>
		</div>
	)
}
