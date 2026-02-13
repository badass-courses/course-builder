'use client'

import { useEffect, useRef } from 'react'

const W = 28
const H = 7

const fills = ['░', '▒', '▓', '█'] as const
const fillWeights: Record<string, number> = {
	' ': 0,
	'░': 0.25,
	'▒': 0.5,
	'▓': 0.75,
	'█': 1,
}

function fillFromWeight(w: number): string {
	if (w <= 0.05) return ' '
	if (w < 0.2) return '░'
	if (w < 0.45) return '▒'
	if (w < 0.7) return '▓'
	return '█'
}

type Rect = { x: number; y: number; w: number; h: number; fill: string }

function rasterize(rects: Rect[]): number[][] {
	const grid: number[][] = Array.from({ length: H }, () => new Array(W).fill(0))
	for (const { x, y, w, h, fill } of rects) {
		const weight = fillWeights[fill] ?? 0
		for (let r = y; r < y + h && r < H; r++) {
			for (let c = x; c < x + w && c < W; c++) {
				grid[r]![c] = weight
			}
		}
	}
	return grid
}

function renderGrid(grid: number[][]): string {
	return grid.map((row) => row.map(fillFromWeight).join('')).join('\n')
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

function lerpGrid(a: number[][], b: number[][], t: number): number[][] {
	return a.map((row, r) => row.map((val, c) => lerp(val, b[r]![c]!, t)))
}

// easeInOut for smoother feel
function ease(t: number): number {
	return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const patterns: Rect[][] = [
	[
		{ x: 1, y: 1, w: 5, h: 5, fill: '█' },
		{ x: 8, y: 1, w: 5, h: 5, fill: '▓' },
		{ x: 15, y: 1, w: 5, h: 5, fill: '▒' },
		{ x: 22, y: 1, w: 5, h: 5, fill: '░' },
	],
	[
		{ x: 0, y: 0, w: 7, h: 7, fill: '█' },
		{ x: 7, y: 0, w: 7, h: 7, fill: '▓' },
		{ x: 14, y: 0, w: 7, h: 7, fill: '▒' },
		{ x: 21, y: 0, w: 7, h: 7, fill: '░' },
	],
	[
		{ x: 0, y: 0, w: 8, h: 7, fill: '█' },
		{ x: 8, y: 0, w: 20, h: 7, fill: '░' },
	],
	[
		{ x: 0, y: 0, w: 8, h: 7, fill: '░' },
		{ x: 8, y: 0, w: 20, h: 7, fill: '█' },
	],
	[
		{ x: 1, y: 0, w: 4, h: 3, fill: '▓' },
		{ x: 9, y: 0, w: 4, h: 3, fill: '▓' },
		{ x: 17, y: 0, w: 4, h: 3, fill: '▓' },
		{ x: 5, y: 3, w: 4, h: 3, fill: '▓' },
		{ x: 13, y: 3, w: 4, h: 3, fill: '▓' },
		{ x: 21, y: 3, w: 4, h: 3, fill: '▓' },
	],
	[
		{ x: 0, y: 0, w: 28, h: 7, fill: '░' },
		{ x: 4, y: 1, w: 20, h: 5, fill: '▒' },
		{ x: 8, y: 2, w: 12, h: 3, fill: '▓' },
		{ x: 11, y: 3, w: 6, h: 1, fill: '█' },
	],
	[
		{ x: 0, y: 0, w: 28, h: 1, fill: '█' },
		{ x: 0, y: 1, w: 28, h: 2, fill: '▓' },
		{ x: 0, y: 3, w: 28, h: 2, fill: '▒' },
		{ x: 0, y: 5, w: 28, h: 2, fill: '░' },
	],
	[
		{ x: 2, y: 1, w: 3, h: 2, fill: '█' },
		{ x: 10, y: 0, w: 4, h: 3, fill: '▒' },
		{ x: 20, y: 2, w: 6, h: 3, fill: '▓' },
		{ x: 6, y: 4, w: 5, h: 3, fill: '░' },
		{ x: 16, y: 5, w: 3, h: 2, fill: '█' },
	],
]

const rasterized = patterns.map(rasterize)

export function SubtleHeartbeat({
	className = '',
	interval = 2000,
}: {
	interval?: number
	className?: string
}) {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		let frameId: number
		let patternIdx = 0
		let startTime = performance.now()

		const holdTime = interval * 0.3 // pause on each pattern
		const transitionTime = interval * 0.7 // smooth morph between

		const tick = (now: number) => {
			const elapsed = now - startTime
			const from = rasterized[patternIdx]!
			const nextIdx = (patternIdx + 1) % rasterized.length
			const to = rasterized[nextIdx]!

			if (elapsed < holdTime) {
				// holding on current pattern
				if (ref.current) ref.current.textContent = renderGrid(from)
			} else {
				const t = Math.min((elapsed - holdTime) / transitionTime, 1)
				const grid = lerpGrid(from, to, ease(t))
				if (ref.current) ref.current.textContent = renderGrid(grid)

				if (t >= 1) {
					patternIdx = nextIdx
					startTime = now
				}
			}

			frameId = requestAnimationFrame(tick)
		}

		frameId = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(frameId)
	}, [interval])

	return (
		<div
			ref={ref}
			className={`select-none whitespace-pre font-mono text-white/20 ${className}`}
			style={{ fontSize: '11px', lineHeight: '1.3' }}
		/>
	)
}
