'use client'

import { useEffect } from 'react'

export function Debug({ label }: { label: string }) {
	useEffect(() => {
		console.log(`Debug Component Mounted: ${label}`)
		return () => {
			console.log(`Debug Component Unmounted: ${label}`)
		}
	}, [label])

	return (
		<div
			style={{
				padding: '2px 5px',
				background: 'rgba(255,0,0,0.1)',
				border: '1px solid rgba(255,0,0,0.2)',
				borderRadius: '3px',
				fontSize: '10px',
				position: 'relative',
				zIndex: 9999,
			}}
		>
			DEBUG: {label}
		</div>
	)
}
