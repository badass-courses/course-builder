'use client'

import { useEffect, useMemo, useRef } from 'react'

const COLS = 100
const ROWS = 26
const TOTAL_FRAMES = 150
const ASPECT = 2.0
const CONNECTION_RANGE = 35

const NODES = [
	{
		homeCol: 15,
		homeRow: 6,
		freqX: 1,
		freqY: 2,
		radiusX: 6,
		radiusY: 3,
		phaseX: 0,
		phaseY: 0,
	},
	{
		homeCol: 40,
		homeRow: 20,
		freqX: 2,
		freqY: 1,
		radiusX: 5,
		radiusY: 4,
		phaseX: 1,
		phaseY: 0.5,
	},
	{
		homeCol: 70,
		homeRow: 8,
		freqX: 1,
		freqY: 3,
		radiusX: 7,
		radiusY: 2,
		phaseX: 2,
		phaseY: 1,
	},
	{
		homeCol: 85,
		homeRow: 18,
		freqX: 3,
		freqY: 1,
		radiusX: 4,
		radiusY: 3,
		phaseX: 0.5,
		phaseY: 2,
	},
	{
		homeCol: 50,
		homeRow: 13,
		freqX: 2,
		freqY: 2,
		radiusX: 8,
		radiusY: 3,
		phaseX: 1.5,
		phaseY: 0.8,
	},
	{
		homeCol: 25,
		homeRow: 20,
		freqX: 1,
		freqY: 1,
		radiusX: 5,
		radiusY: 4,
		phaseX: 3,
		phaseY: 1.5,
	},
	{
		homeCol: 60,
		homeRow: 22,
		freqX: 2,
		freqY: 3,
		radiusX: 6,
		radiusY: 2,
		phaseX: 0.8,
		phaseY: 2.5,
	},
]

function getNodePos(
	node: (typeof NODES)[number],
	t: number,
): { col: number; row: number } {
	const col = Math.round(
		node.homeCol + Math.cos(t * node.freqX + node.phaseX) * node.radiusX,
	)
	const row = Math.round(
		node.homeRow + Math.sin(t * node.freqY + node.phaseY) * node.radiusY,
	)
	return {
		col: Math.max(0, Math.min(COLS - 1, col)),
		row: Math.max(0, Math.min(ROWS - 1, row)),
	}
}

function drawLine(
	grid: string[][],
	intensityGrid: number[][],
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	lineIntensity: number,
) {
	let dx = Math.abs(x1 - x0)
	let dy = Math.abs(y1 - y0)
	const sx = x0 < x1 ? 1 : -1
	const sy = y0 < y1 ? 1 : -1
	let err = dx - dy
	let cx = x0
	let cy = y0

	while (true) {
		// Skip endpoints (cursor positions)
		if (!(cx === x0 && cy === y0) && !(cx === x1 && cy === y1)) {
			if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) {
				// Only overwrite if this line is brighter than what's already there
				if (lineIntensity > intensityGrid[cy]![cx]!) {
					grid[cy]![cx] = '\u00B7'
					intensityGrid[cy]![cx] = lineIntensity
				}
			}
		}

		if (cx === x1 && cy === y1) break
		const e2 = 2 * err
		if (e2 > -dy) {
			err -= dy
			cx += sx
		}
		if (e2 < dx) {
			err += dx
			cy += sy
		}
	}
}

// ── Tailwind intensity classes (1-9) ─────────────────────────────
const intensityClasses = [
	'',
	'text-white/5',
	'text-white/10',
	'text-white/[0.18]',
	'text-white/25',
	'text-white/35',
	'text-white/45',
	'text-white/60',
	'text-white/70',
	'text-white/85',
]

function generateFrames(): string[] {
	const htmlFrames: string[] = []

	for (let f = 0; f < TOTAL_FRAMES; f++) {
		const t = (f / TOTAL_FRAMES) * Math.PI * 2

		// Init empty grid
		const grid: string[][] = []
		const intensityGrid: number[][] = []
		for (let r = 0; r < ROWS; r++) {
			grid[r] = new Array(COLS).fill(' ')
			intensityGrid[r] = new Array(COLS).fill(0)
		}

		// Compute node positions for this frame
		const positions = NODES.map((node) => getNodePos(node, t))

		// Draw connection lines between nearby nodes
		for (let i = 0; i < positions.length; i++) {
			for (let j = i + 1; j < positions.length; j++) {
				const a = positions[i]!
				const b = positions[j]!
				const dx = b.col - a.col
				const dy = (b.row - a.row) * ASPECT
				const dist = Math.sqrt(dx * dx + dy * dy)

				if (dist < CONNECTION_RANGE) {
					const lineIntensity =
						Math.floor((1 - dist / CONNECTION_RANGE) * 5) + 2
					drawLine(
						grid,
						intensityGrid,
						a.col,
						a.row,
						b.col,
						b.row,
						lineIntensity,
					)
				}
			}
		}

		// Place cursors
		const blinkPhase = Math.floor(f / 10) % 2
		const cursorIntensity = blinkPhase === 0 ? 7 : 3

		for (const pos of positions) {
			grid[pos.row]![pos.col] = '\u2588'
			intensityGrid[pos.row]![pos.col] = cursorIntensity
		}

		// Render frame to HTML
		const lines: string[] = []
		for (let r = 0; r < ROWS; r++) {
			const parts: string[] = []
			for (let c = 0; c < COLS; c++) {
				const ch = grid[r]![c]!
				const ci = intensityGrid[r]![c]!
				if (ci <= 0 || ch === ' ') {
					parts.push(' ')
				} else {
					parts.push(`<span class="${intensityClasses[ci]}">${ch}</span>`)
				}
			}
			lines.push(parts.join(''))
		}
		htmlFrames.push(lines.join('\n'))
	}

	return htmlFrames
}

export function CursorConstellation() {
	const preRef = useRef<HTMLPreElement>(null)
	const frames = useMemo(() => generateFrames(), [])

	useEffect(() => {
		let frameIdx = 0
		let lastTime = 0
		const interval = 1000 / 14
		let rafId: number

		function tick(time: number) {
			if (time - lastTime >= interval) {
				lastTime = time
				if (preRef.current) {
					preRef.current.innerHTML = frames[frameIdx]!
				}
				frameIdx = (frameIdx + 1) % frames.length
			}
			rafId = requestAnimationFrame(tick)
		}

		rafId = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(rafId)
	}, [frames])

	return (
		<div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-50">
			<pre
				ref={preRef}
				className="m-0 select-none whitespace-pre p-0 font-mono text-[11px] leading-[1.15] tracking-[0.05em]"
			/>
		</div>
	)
}
