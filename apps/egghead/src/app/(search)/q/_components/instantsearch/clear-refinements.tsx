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
			className="flex items-center gap-2"
			onClick={() => {
				clear()
			}}
		>
			<X size={24} /> Clear all filters
		</Button>
	)
}
