'use client'

import { useEffect, useRef } from 'react'
import { setIntervalOnVisible } from '@/utils/set-timeout-on-visible'

// 30 chars wide x 9 lines tall box-drawing frames
// each frame is a different TUI panel arrangement

const frames = [
	// sidebar + main, horizontal split on right
	[
		'┌─────────┬──────────────────┐',
		'│         │                  │',
		'│         ├────────┬─────────┤',
		'│         │        │         │',
		'│         │        │         │',
		'│         ├────────┴─────────┤',
		'│         │                  │',
		'│         │                  │',
		'└─────────┴──────────────────┘',
	],
	// header + sidebar + main + footer
	[
		'┌────────────────────────────┐',
		'├─────────┬──────────────────┤',
		'│         │                  │',
		'│         │                  │',
		'│         │                  │',
		'│         │                  │',
		'│         │                  │',
		'├─────────┴──────────────────┤',
		'└────────────────────────────┘',
	],
	// 3 equal columns
	[
		'┌────────┬─────────┬─────────┐',
		'│        │         │         │',
		'│        │         │         │',
		'│        │         │         │',
		'│        │         │         │',
		'│        │         │         │',
		'│        │         │         │',
		'│        │         │         │',
		'└────────┴─────────┴─────────┘',
	],
	// 3 columns, center split horizontally
	[
		'┌────────┬─────────┬─────────┐',
		'│        │         │         │',
		'│        │         │         │',
		'│        ├─────────┤         │',
		'│        │         │         │',
		'│        │         │         │',
		'│        ├─────────┤         │',
		'│        │         │         │',
		'└────────┴─────────┴─────────┘',
	],
	// quadrant split
	[
		'┌─────────────┬──────────────┐',
		'│             │              │',
		'│             │              │',
		'│             │              │',
		'├─────────────┼──────────────┤',
		'│             │              │',
		'│             │              │',
		'│             │              │',
		'└─────────────┴──────────────┘',
	],
	// header + 3-column body
	[
		'┌────────────────────────────┐',
		'│                            │',
		'├────────┬─────────┬─────────┤',
		'│        │         │         │',
		'│        │         │         │',
		'│        │         │         │',
		'│        │         │         │',
		'│        │         │         │',
		'└────────┴─────────┴─────────┘',
	],
	// sidebar + stacked right panels
	[
		'┌────┬───────────────────────┐',
		'│    │                       │',
		'│    ├───────────────────────┤',
		'│    │                       │',
		'│    ├───────────────────────┤',
		'│    │                       │',
		'│    ├───────────────────────┤',
		'│    │                       │',
		'└────┴───────────────────────┘',
	],
	// full single pane
	[
		'┌────────────────────────────┐',
		'│                            │',
		'│                            │',
		'│                            │',
		'│                            │',
		'│                            │',
		'│                            │',
		'│                            │',
		'└────────────────────────────┘',
	],
]

const compiled = frames.map((f) => f.join('\n'))

export function SubtleGridLines({ className = '' }: { className?: string }) {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		let i = 0
		const animate = () => {
			if (ref.current) {
				ref.current.textContent = compiled[i]!
				i = (i + 1) % compiled.length
			}
		}
		animate()
		const cleanup = setIntervalOnVisible({
			element: ref.current,
			callback: animate,
			interval: 700,
		})
		return () => {
			cleanup?.()
		}
	}, [])

	return (
		<div
			ref={ref}
			className={`select-none whitespace-pre font-mono text-white/20 ${className}`}
			style={{ fontSize: '11px', lineHeight: '1.3' }}
		/>
	)
}
