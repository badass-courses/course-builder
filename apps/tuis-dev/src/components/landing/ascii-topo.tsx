'use client'

import { useEffect, useRef } from 'react'

const CHAR_WIDTH = 6.65
const CHAR_HEIGHT = 12.65
const TOTAL_FRAMES = 120
const NUM_BANDS = 6
const CONTOUR_THRESHOLD = 0.22

// Tailwind classes (must appear literally for scanner)
// text-white/10 text-white/15 text-white/20 text-white/30 text-white/35

function terrain(x: number, y: number, t: number): number {
	// Broad undulation
	let h = 0.25 * Math.sin(x * 4.5 + t * 0.8) * Math.cos(y * 3.5 - t * 0.3)
	// Ridge system
	h += 0.2 * Math.sin((x * 2 + y * 3) * 3 + t * 0.5)
	// Wandering peak
	const cx1 = 0.5 + 0.25 * Math.sin(t * 0.4)
	const cy1 = 0.5 + 0.2 * Math.cos(t * 0.6)
	h += 0.35 * Math.exp(-((x - cx1) ** 2 + (y - cy1) ** 2) * 10)
	// Second wandering peak
	const cx2 = 0.35 + 0.2 * Math.cos(t * 0.7)
	const cy2 = 0.65 + 0.15 * Math.sin(t * 0.5)
	h += 0.25 * Math.exp(-((x - cx2) ** 2 + (y - cy2) ** 2) * 14)
	// Fine detail
	h += 0.08 * Math.sin(x * 14 + t) * Math.sin(y * 11 - t * 0.7)
	return h
}

function generateFrame(f: number, cols: number, rows: number): string {
	const t = (f / TOTAL_FRAMES) * Math.PI * 2
	const step = 0.8 / cols
	const lines: string[] = []

	for (let y = 0; y < rows; y++) {
		const parts: string[] = []
		for (let x = 0; x < cols; x++) {
			const nx = x / cols
			const ny = y / rows

			// Edge fade
			const ex = (x - cols / 2) / (cols / 2)
			const ey = (y - rows / 2) / (rows / 2)
			if (ex * ex + ey * ey > 1.8) {
				parts.push(' ')
				continue
			}

			const h = terrain(nx, ny, t)
			const band = Math.sin(h * Math.PI * NUM_BANDS)
			const sharpness = Math.abs(band)

			if (sharpness < CONTOUR_THRESHOLD) {
				// On a contour — compute gradient for line direction
				const gx = terrain(nx + step, ny, t) - terrain(nx - step, ny, t)
				const gy = terrain(nx, ny + step, t) - terrain(nx, ny - step, t)
				let a = Math.atan2(gy, gx)
				if (a < 0) a += Math.PI

				// Gradient direction → contour character (perpendicular)
				let ch: string
				if (a < Math.PI / 8 || a >= (7 * Math.PI) / 8) ch = '│'
				else if (a < (3 * Math.PI) / 8) ch = '╱'
				else if (a < (5 * Math.PI) / 8) ch = '─'
				else ch = '╲'

				// Brightness: elevation × proximity to contour center
				const b = Math.max(0, h + 0.3) * (1 - sharpness / CONTOUR_THRESHOLD)
				const cls =
					b > 0.45
						? 'text-white/35'
						: b > 0.2
							? 'text-white/20'
							: 'text-white/15'

				parts.push(`<span class="${cls}">${ch}</span>`)
			} else if (h > 0.3 && (x * 7 + y * 13) % 7 === 0) {
				// Sparse elevation dots
				parts.push(`<span class="text-white/10">·</span>`)
			} else {
				parts.push(' ')
			}
		}
		lines.push(parts.join(''))
	}
	return lines.join('\n')
}

export function AsciiTopo({
	opacity = 50,
	className = '',
}: {
	opacity?: number
	className?: string
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const preRef = useRef<HTMLPreElement>(null)
	const framesRef = useRef<string[]>([])
	const sizeRef = useRef({ cols: 0, rows: 0 })
	const frameIdxRef = useRef(0)

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		let cancelled = false

		function rebuildFrames() {
			const w = container!.clientWidth
			const h = container!.clientHeight
			if (w === 0 || h === 0) return

			const cols = Math.ceil(w / CHAR_WIDTH)
			const rows = Math.ceil(h / CHAR_HEIGHT)
			if (cols === sizeRef.current.cols && rows === sizeRef.current.rows)
				return

			sizeRef.current = { cols, rows }
			framesRef.current = []
			frameIdxRef.current = 0
			cancelled = false

			let nextFrame = 0
			function generateChunk() {
				if (cancelled) return
				const deadline = performance.now() + 8
				while (nextFrame < TOTAL_FRAMES && performance.now() < deadline) {
					framesRef.current[nextFrame] = generateFrame(
						nextFrame,
						cols,
						rows,
					)
					nextFrame++
				}
				if (nextFrame < TOTAL_FRAMES) {
					setTimeout(generateChunk, 0)
				}
			}
			generateChunk()
		}

		const ro = new ResizeObserver(() => {
			cancelled = true
			rebuildFrames()
		})
		ro.observe(container)
		rebuildFrames()

		return () => {
			cancelled = true
			ro.disconnect()
		}
	}, [])

	useEffect(() => {
		let lastTime = 0
		const interval = 1000 / 12
		let rafId: number

		function tick(time: number) {
			if (time - lastTime >= interval) {
				lastTime = time
				const frames = framesRef.current
				const idx = frameIdxRef.current % TOTAL_FRAMES
				if (preRef.current && frames[idx]) {
					preRef.current.innerHTML = frames[idx]!
				}
				frameIdxRef.current++
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
