'use client'

import { useEffect, useRef } from 'react'
import { setIntervalOnVisible } from '@/utils/set-timeout-on-visible'

export function SubtleMenuBrowse({ className = '' }: { className?: string }) {
	const ref = useRef<HTMLDivElement>(null)

	const widths = [12, 5, 10, 20, 4]
	const frames: string[] = []

	for (let active = 0; active < widths.length; active++) {
		const lines = widths.map((w, i) => {
			if (i === active) {
				return `<span class="text-[#C0FFBD]/60"> ▸ ${'█'.repeat(w)}</span>`
			}
			return `   ${'░'.repeat(w)}`
		})
		frames.push(lines.join('\n'))
	}

	useEffect(() => {
		let i = 0
		const animate = () => {
			if (ref.current) {
				ref.current.innerHTML = frames[i]!
				i = (i + 1) % frames.length
			}
		}
		animate()
		const cleanup = setIntervalOnVisible({
			element: ref.current,
			callback: animate,
			interval: 500,
		})
		return () => {
			cleanup?.()
		}
	}, [])

	return (
		<div
			ref={ref}
			className={`select-none whitespace-pre text-left font-mono text-white/20 ${className}`}
			style={{ fontSize: '10px', lineHeight: '1.4', letterSpacing: '0.05em' }}
		/>
	)
}
