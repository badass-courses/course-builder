'use client'

import { useHitsPerPage, UseHitsPerPageProps } from 'react-instantsearch'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui'

export function HitsPerPageSelect(props: UseHitsPerPageProps) {
	const { items, refine } = useHitsPerPage(props)

	return (
		<Select
			onValueChange={(value) => {
				refine(Number(value))
			}}
		>
			<SelectTrigger className="text-muted-foreground bg-background text-base sm:w-2/3 lg:w-1/5">
				<SelectValue placeholder="Results per Page" />
			</SelectTrigger>
			<SelectContent>
				{items.map((item) => (
					<SelectItem key={item.value} value={item.value.toString()}>
						{item.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
