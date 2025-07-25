'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/icon'
import { useDebouncedState } from '@/hooks/use-debounced-state'

import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui'

const POST_TYPES = [
	{ value: 'all', label: 'All Types' },
	{ value: 'article', label: 'Articles' },
	{ value: 'lesson', label: 'Lessons' },
	{ value: 'podcast', label: 'Podcasts' },
	{ value: 'tip', label: 'Tips' },
	{ value: 'course', label: 'Courses' },
] as const

export const PostsSearchFilter: React.FC<
	React.InputHTMLAttributes<HTMLInputElement>
> = (props) => {
	const searchParams = useSearchParams()
	const { replace } = useRouter()
	const [search, setSearch] = useDebouncedState(
		searchParams.get('search') || '',
		300,
	)
	const [currentSearch, setCurrentSearch] = React.useState(
		searchParams.get('search') || '',
	)

	const [postType, setPostType] = React.useState(
		searchParams.get('postType') || 'all',
	)

	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString())
		if (search) {
			params.set('search', search)
		} else {
			params.delete('search')
		}
		if (postType && postType !== 'all') {
			params.set('postType', postType)
		} else {
			params.delete('postType')
		}
		replace(`?${params.toString()}`)
	}, [search, postType, replace, searchParams])

	const hasActiveFilters = currentSearch || (postType && postType !== 'all')

	return (
		<div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
			<div className="relative flex flex-1 items-center">
				<Label htmlFor="search" className="sr-only">
					Search
				</Label>
				<Input
					type="search"
					{...props}
					value={currentSearch}
					onChange={(e) => {
						setCurrentSearch(e.target.value)
						setSearch(e.target.value)
					}}
					placeholder="Search posts by title..."
					className="w-full pl-9"
				/>
				<div className="absolute inset-y-0 left-0 flex items-center pl-3">
					<Icon className="h-4 w-4 text-gray-400" name="Search" />
				</div>
				{currentSearch && (
					<Button
						variant="ghost"
						size="icon"
						className="absolute inset-y-0 right-0 flex items-center pr-3"
						onClick={() => {
							setCurrentSearch('')
							setSearch('')
						}}
					>
						<span className="sr-only">Clear</span>
					</Button>
				)}
			</div>
			<div className="flex items-center gap-2">
				<Select value={postType} onValueChange={setPostType}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="All Types" />
					</SelectTrigger>
					<SelectContent>
						{POST_TYPES.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{hasActiveFilters && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setCurrentSearch('')
							setSearch('')
							setPostType('all')
						}}
						className="flex items-center gap-1"
					>
						Clear
					</Button>
				)}
			</div>
		</div>
	)
}
