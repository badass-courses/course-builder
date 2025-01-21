'use client'

import { cn } from '@/utils/cn'
import { X } from 'lucide-react'
import { useClearRefinements, useQueryRules } from 'react-instantsearch'

import { Button } from '@coursebuilder/ui'

export default function ClearRefinements({
	className,
}: {
	className?: string
}) {
	const { refine: clear, canRefine: canClear } = useClearRefinements()

	if (!canClear) {
		return null
	}

	return (
		<Button
			variant="ghost"
			disabled={!canClear}
			className={cn(
				'text-muted-foreground flex items-center gap-1 font-normal',
				className,
			)}
			onClick={() => {
				clear()
			}}
		>
			<X size={16} /> Clear all filters
		</Button>
	)
}
