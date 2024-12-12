'use client'

import type { SearchBoxProps } from 'react-instantsearch'
import { useSearchBox } from 'react-instantsearch'

import { Input } from '@coursebuilder/ui'

export const SearchBox = (props: SearchBoxProps) => {
	const { refine, clear, isSearchStalled, ...rest } = useSearchBox(props)

	return (
		<Input
			className="bg-background my-4"
			onChange={(event) => refine(event.currentTarget.value)}
			placeholder="Search..."
			{...rest}
		/>
	)
}
