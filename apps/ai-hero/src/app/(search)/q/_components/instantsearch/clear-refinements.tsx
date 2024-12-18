'use client'

import { X } from 'lucide-react'
import { useClearRefinements, useQueryRules } from 'react-instantsearch'

import { Button } from '@coursebuilder/ui'

export default function ClearRefinements() {
	const { refine: clear, canRefine: canClear } = useClearRefinements()

	return (
		<Button
			variant="ghost"
			disabled={!canClear}
			className="text-muted-foreground flex items-center gap-1 font-normal"
			onClick={() => {
				clear()
			}}
		>
			<X size={16} /> Clear all filters
		</Button>
	)
}
