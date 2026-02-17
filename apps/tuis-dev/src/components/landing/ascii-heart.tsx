'use client'

import { useCallback, useRef, useState } from 'react'

// Heart shape via implicit equation: (x²+y²-1)³ - x²y³ < 0
// COLS ~2x ROWS to compensate for tall monospace chars

const COLS = 34
const ROWS = 17
const RADIUS = 2

type Cell = { char: string; filled: boolean }

function buildHeart(): Cell[][] {
	const grid: Cell[][] = []
	for (let r = 0; r < ROWS; r++) {
		const row: Cell[] = []
		for (let c = 0; c < COLS; c++) {
			const x = ((c / (COLS - 1)) * 2 - 1) * 1.2
			const y = (1 - r / (ROWS - 1)) * 2.6 - 1.1
			const v = (x * x + y * y - 1) ** 3 - x * x * y * y * y
			row.push({ char: v < 0 ? '█' : ' ', filled: v < 0 })
		}
		grid.push(row)
	}
	return grid
}

const grid = buildHeart()

function dist(r1: number, c1: number, r2: number, c2: number) {
	// cols are ~half the visual width of rows in monospace, so scale
	const dr = r1 - r2
	const dc = (c1 - c2) * 0.5
	return Math.sqrt(dr * dr + dc * dc)
}

export function AsciiHeart({ className = '' }: { className?: string }) {
	const [hover, setHover] = useState<[number, number] | null>(null)
	const rafRef = useRef<number | null>(null)

	const handleMouseEnter = useCallback((r: number, c: number) => {
		if (rafRef.current) cancelAnimationFrame(rafRef.current)
		rafRef.current = requestAnimationFrame(() => setHover([r, c]))
	}, [])

	const handleMouseLeave = useCallback(() => {
		if (rafRef.current) cancelAnimationFrame(rafRef.current)
		rafRef.current = requestAnimationFrame(() => setHover(null))
	}, [])

	return (
		<pre
			className={`select-none font-mono text-[8px] leading-[1.1] text-white/20 ${className}`}
			aria-hidden
			onMouseLeave={handleMouseLeave}
		>
			{grid.map((row, r) => (
				<span key={r}>
					{row.map((cell, c) => {
						if (!cell.filled) return cell.char

						const d = hover ? dist(r, c, hover[0], hover[1]) : Infinity
						const lit = d <= RADIUS

						return (
							<span
								key={c}
								className="transition-colors duration-150"
								style={
									lit
										? {
												color: `oklch(0.94 0.108 143.54 / ${1 - d / (RADIUS + 1)})`,
											}
										: undefined
								}
								onMouseEnter={() => handleMouseEnter(r, c)}
							>
								{cell.char}
							</span>
						)
					})}
					{r < ROWS - 1 ? '\n' : ''}
				</span>
			))}
		</pre>
	)
}
