'use client'

import { useEffect, useRef } from 'react'
import { setIntervalOnVisible } from '@/utils/set-timeout-on-visible'

export function SubtleMenuCycle({ className = '' }: { className?: string }) {
	const ref = useRef<HTMLDivElement>(null)

	const items = ['New file', 'Open', 'Save', 'Settings', 'Quit']
	const frames = items.map((item) => `▸ ${item}`)

	useEffect(() => {
		let i = 0
		const animate = () => {
			if (ref.current) {
				ref.current.textContent = frames[i]!
				i = (i + 1) % frames.length
			}
		}
		animate()
		const cleanup = setIntervalOnVisible({
			element: ref.current,
			callback: animate,
			interval: 1000,
		})
		return () => {
			cleanup?.()
		}
	}, [])

	return (
		<div
			ref={ref}
			className={`select-none whitespace-pre font-mono text-white/20 ${className}`}
			style={{ fontSize: '10px', lineHeight: '1', letterSpacing: '0.05em' }}
		/>
	)
}
