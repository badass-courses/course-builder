import { useEffect, useState } from 'react'
import { Workbench } from '@/treehouse/workbench/workbench'

import { Node } from '../model/mod'

function debounce(func: Function, timeout = 1000) {
	let timer: any
	return (...args: any) => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			// @ts-ignore
			func.apply(this, args)
		}, timeout)
	}
}

interface SmartNodeProps {
	workbench: Workbench
	node: Node
}

export const SmartNode: React.FC<SmartNodeProps> = ({ workbench, node }) => {
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<any[]>([])
	const [initialSearch, setInitialSearch] = useState(false)

	useEffect(() => {
		const searchDebounce = debounce(search, 300)
		searchDebounce()

		// Observe changes to the node
		// This part needs adaptation to React, as direct observation like in Mithril isn't straightforward
		// Consider using a context or state management library for complex interactions

		return () => {
			// Cleanup if needed
		}
	}, [query, node])

	const search = () => {
		if (!query) {
			setResults([])
			return
		}
		setInitialSearch(true)

		const newResults = workbench
			.search(query)
			.filter(
				(n: any) =>
					n.id !== node.id && (node.parent ? n.id !== node.parent.id : true),
			)

		// Assuming results are set directly without comparing previous results for simplicity
		setResults(newResults)
	}

	const handleIcon = (collapsed: boolean = false) => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			className="node-bullet"
			width="15"
			height="15"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{collapsed ? (
				<circle
					id="node-collapsed-handle"
					stroke="none"
					cx="12"
					cy="12"
					r="12"
				/>
			) : null}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				x="3"
				y="3"
				width="19"
				height="19"
				viewBox="0 0 24 24"
			>
				<circle cx="11" cy="11" r="8"></circle>
				<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
			</svg>
		</svg>
	)

	// belowEditor and other methods need to be adapted based on their usage within the component

	return <div>{/* Render logic based on state */}</div>
}
