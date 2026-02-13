'use client'

import { useEffect, useRef } from 'react'

const CHAR_WIDTH = 6.65
const CHAR_HEIGHT = 12.65
const TICK_MS = 250 // ~4 FPS, slow contemplative
const GHOST_LIFE = 3
const RESEED_BELOW = 0.01
const STAGNATION_LIMIT = 40

// Tailwind classes (must appear literally for scanner)
// text-white/8 text-white/15 text-white/25 text-white/40
const ALIVE_OPACITY = ['', 'text-white/15', 'text-white/15', 'text-white/25', 'text-white/25', 'text-white/40']

interface LifeState {
	cols: number
	rows: number
	grid: Uint8Array
	age: Uint8Array
	ghost: Uint8Array
	prevPop: number
	staleCount: number
}

function createSeed(cols: number, rows: number): Uint8Array {
	const size = cols * rows
	const grid = new Uint8Array(size)
	const clusters = Math.max(3, Math.floor(Math.sqrt(size) / 12))
	for (let c = 0; c < clusters; c++) {
		const cx = Math.floor(Math.random() * cols)
		const cy = Math.floor(Math.random() * rows)
		const r = 3 + Math.floor(Math.random() * 5)
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				if (Math.random() < 0.35) {
					const x = (cx + dx + cols) % cols
					const y = (cy + dy + rows) % rows
					grid[y * cols + x] = 1
				}
			}
		}
	}
	return grid
}

function stepLife(s: LifeState) {
	const { cols, rows, grid, age, ghost } = s
	const size = cols * rows
	const next = new Uint8Array(size)
	const nextAge = new Uint8Array(size)

	for (let i = 0; i < size; i++) {
		if (ghost[i]! > 0) ghost[i]!--
	}

	let pop = 0
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const i = y * cols + x
			let n = 0
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue
					if (grid[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)] === 1) n++
				}
			}

			const alive = grid[i] === 1
			if (alive && (n === 2 || n === 3)) {
				next[i] = 1
				nextAge[i] = Math.min(255, (age[i] ?? 0) + 1)
				pop++
			} else if (!alive && n === 3) {
				next[i] = 1
				nextAge[i] = 1
				pop++
			} else if (alive) {
				ghost[i] = GHOST_LIFE
			}
		}
	}

	if (pop === s.prevPop) s.staleCount++
	else s.staleCount = 0
	s.prevPop = pop

	if (pop / size < RESEED_BELOW || s.staleCount > STAGNATION_LIMIT) {
		const cx = Math.floor(Math.random() * cols)
		const cy = Math.floor(Math.random() * rows)
		const r = Math.floor(Math.min(cols, rows) * 0.12)
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				if (Math.random() < 0.15) {
					const nx = (cx + dx + cols) % cols
					const ny = (cy + dy + rows) % rows
					next[ny * cols + nx] = 1
					nextAge[ny * cols + nx] = 1
				}
			}
		}
		s.staleCount = 0
	}

	s.grid = next
	s.age = nextAge
}

function renderLife(s: LifeState): string {
	const { cols, rows, grid, age, ghost } = s
	const lines: string[] = []

	for (let y = 0; y < rows; y++) {
		const parts: string[] = []
		for (let x = 0; x < cols; x++) {
			const i = y * cols + x
			if (grid[i] === 1) {
				const a = Math.min(age[i]!, ALIVE_OPACITY.length - 1)
				const cls = ALIVE_OPACITY[a]!
				if (cls) {
					parts.push(`<span class="${cls}">·</span>`)
				} else {
					parts.push(' ')
				}
			} else if (ghost[i]! > 0) {
				parts.push(`<span class="text-white/8">·</span>`)
			} else {
				parts.push(' ')
			}
		}
		lines.push(parts.join(''))
	}
	return lines.join('\n')
}

export function AsciiLife({
	opacity = 50,
	className = '',
}: {
	opacity?: number
	className?: string
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const preRef = useRef<HTMLPreElement>(null)
	const stateRef = useRef<LifeState | null>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		function init() {
			const w = container!.clientWidth
			const h = container!.clientHeight
			if (w === 0 || h === 0) return

			const cols = Math.ceil(w / CHAR_WIDTH)
			const rows = Math.ceil(h / CHAR_HEIGHT)
			if (stateRef.current?.cols === cols && stateRef.current?.rows === rows)
				return

			const size = cols * rows
			const grid = createSeed(cols, rows)
			const age = new Uint8Array(size)
			for (let i = 0; i < size; i++) {
				if (grid[i] === 1) age[i] = 1
			}

			stateRef.current = {
				cols,
				rows,
				grid,
				age,
				ghost: new Uint8Array(size),
				prevPop: 0,
				staleCount: 0,
			}
		}

		const ro = new ResizeObserver(init)
		ro.observe(container)
		init()
		return () => ro.disconnect()
	}, [])

	useEffect(() => {
		let rafId: number
		let lastTime = 0

		function tick(time: number) {
			if (time - lastTime >= TICK_MS) {
				lastTime = time
				const s = stateRef.current
				if (s && preRef.current) {
					stepLife(s)
					preRef.current.innerHTML = renderLife(s)
				}
			}
			rafId = requestAnimationFrame(tick)
		}

		rafId = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(rafId)
	}, [])

	return (
		<div
			ref={containerRef}
			className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
			style={{ opacity: opacity / 100 }}
		>
			<pre
				ref={preRef}
				className="m-0 select-none whitespace-pre p-0 font-mono text-[11px] leading-[1.15] tracking-[0.05em]"
			/>
		</div>
	)
}
