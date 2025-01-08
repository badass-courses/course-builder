'use client'

import React from 'react'
import { cn } from '@/utils/cn'
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
		<Input
			className={cn('bg-background my-4 text-base', props.className)}
			onChange={(event) => refine(event.currentTarget.value)}
			defaultValue={queryParam || ''}
			placeholder="Search..."
			{...rest}
		/>
	)
}
