'use client'

import * as React from 'react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'

type SearchExistingLessonsProps = {
	onSelect: (resource: ContentResource) => void
	onCancel: () => void
}

export function SearchExistingLessons({
	onSelect,
	onCancel,
}: SearchExistingLessonsProps) {
	const [searchTerm, setSearchTerm] = React.useState('')
	const [results, setResults] = React.useState<ContentResource[]>([])

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault()
		// Implement your search logic here
		// const searchResults = await searchLessons(searchTerm)
		// setResults(searchResults)
	}

	return (
		<div className="rounded-md border p-5">
			<form onSubmit={handleSearch} className="mb-4 flex gap-2">
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search lessons..."
					className="flex-1 rounded border p-2"
				/>
				<Button type="submit">Search</Button>
				<Button onClick={onCancel} variant="outline">
					Cancel
				</Button>
			</form>

			<div className="space-y-2">
				{results.map((result) => (
					<div
						key={result.id}
						className="cursor-pointer rounded border p-2 hover:bg-gray-50"
						onClick={() => onSelect(result)}
					>
						{result.fields?.title}
					</div>
				))}
			</div>
		</div>
	)
}
