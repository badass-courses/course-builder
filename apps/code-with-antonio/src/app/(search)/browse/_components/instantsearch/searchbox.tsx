'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import { Search } from 'lucide-react'
import { useQueryState } from 'nuqs'
import type { SearchBoxProps } from 'react-instantsearch'
import { useSearchBox } from 'react-instantsearch'

import { Input } from '@coursebuilder/ui'

export const SearchBox = (
	props: SearchBoxProps & {
		className?: string
	},
) => {
	const { refine, clear, isSearchStalled, ...rest } = useSearchBox(props)
	const [queryParam] = useQueryState('q')

	return (
		<div className="relative flex w-full items-center">
			<Input
				className={cn(
					'bg-muted border-border rounded-full border pl-8 text-base',
					props.className,
				)}
				onChange={(event) => refine(event.currentTarget.value)}
				defaultValue={queryParam || ''}
				placeholder="Search..."
				{...rest}
			/>
			<Search className="text-muted-foreground absolute left-3 w-4" />
		</div>
	)
}
