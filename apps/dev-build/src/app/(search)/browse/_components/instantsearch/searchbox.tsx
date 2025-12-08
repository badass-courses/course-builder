'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import { Search } from 'lucide-react'
import type { SearchBoxProps } from 'react-instantsearch'
import { useSearchBox } from 'react-instantsearch'

import { Input } from '@coursebuilder/ui'

/**
 * SearchBox component for InstantSearch.
 * Provides a text input with search icon for querying content.
 */
export const SearchBox = (
	props: SearchBoxProps & {
		className?: string
	},
) => {
	const { query, refine } = useSearchBox(props)

	return (
		<div className="relative flex w-full items-center">
			<Input
				className={cn(
					'bg-background shadow-xs border-border rounded-full border pl-8 text-base',
					props.className,
				)}
				value={query}
				onChange={(event) => refine(event.currentTarget.value)}
				placeholder="Search..."
			/>
			<Search className="text-muted-foreground absolute left-3 w-4" />
		</div>
	)
}
