'use client'

import React from 'react'
import { useQueryState } from 'nuqs'
import type { SearchBoxProps } from 'react-instantsearch'
import { useSearchBox } from 'react-instantsearch'

import { Input } from '@coursebuilder/ui'

export const SearchBox = (props: SearchBoxProps) => {
	const { refine, clear, isSearchStalled, ...rest } = useSearchBox(props)
	const [queryParam] = useQueryState('q')

	return (
		<Input
			className="bg-background my-4 text-base"
			onChange={(event) => refine(event.currentTarget.value)}
			defaultValue={queryParam || ''}
			placeholder="Search..."
			{...rest}
		/>
	)
}
