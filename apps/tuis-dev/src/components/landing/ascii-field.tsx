'use client'

import { useEffect, useRef } from 'react'

// Fills the container with a slow-drifting interference pattern
// Very low contrast — mostly spaces with faint dots/dashes

const CHAR_WIDTH = 6.65 // approx width of a monospace char at 11px
const CHAR_HEIGHT = 12.65 // approx line height at 11px * 1.15
const TOTAL_FRAMES = 120

// Only use the faintest chars — keep it whisper-quiet
const FIELD_CHARS = ' .·:'

// Tailwind classes for each intensity level (must appear literally for scanner)
const fClass = ['', 'text-white/15', 'text-white/25', 'text-white/40']

function generateFrame(f: number, cols: number, rows: number): string {
	const t = (f / TOTAL_FRAMES) * Math.PI * 2
	const lines: string[] = []

	for (let row = 0; row < rows; row++) {
		const parts: string[] = []
		for (let col = 0; col < cols; col++) {
			const x = col / cols
			const y = row / rows

			const v1 = Math.sin(x * 18 + t) * Math.sin(y * 12 + t * 3)
			const v2 = Math.sin((x + y) * 14 - t * 2) * 0.6
			const v3 = Math.sin(x * 8 - y * 10 + t * 2) * 0.3
			const v4 =
				Math.sin(Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2) * 25 - t) * 0.4

			let v = (v1 + v2 + v3 + v4) * 0.25

			const dx = (col - cols / 2) / (cols / 2)
			const dy = (row - rows / 2) / (rows / 2)
			const dist = Math.sqrt(dx * dx + dy * dy)
			const fade = Math.max(0, 1 - dist * 0.6)

			v *= fade

			const intensity = Math.max(0, (v + 0.3) * 0.7)
			const ci = Math.floor(intensity * (FIELD_CHARS.length - 1))

			if (ci <= 0) {
				parts.push(' ')
			} else {
				parts.push(`<span class="${fClass[ci]}">${FIELD_CHARS[ci]}</span>`)
			}
		}
		lines.push(parts.join(''))
	}
	return lines.join('\n')
}

export function AsciiField({
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
	const genRef = useRef(0)

	// Measure container and regenerate all frames when size changes
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		function rebuildFrames() {
			const w = container!.clientWidth
			const h = container!.clientHeight
			if (w === 0 || h === 0) return

			const cols = Math.ceil(w / CHAR_WIDTH)
			const rows = Math.ceil(h / CHAR_HEIGHT)

			// Skip if size hasn't changed
			if (cols === sizeRef.current.cols && rows === sizeRef.current.rows) return

			const gen = ++genRef.current
			sizeRef.current = { cols, rows }
			framesRef.current = []
			frameIdxRef.current = 0

			let nextFrame = 0
			function generateChunk() {
				if (genRef.current !== gen) return
				const deadline = performance.now() + 8
				while (nextFrame < TOTAL_FRAMES && performance.now() < deadline) {
					framesRef.current[nextFrame] = generateFrame(nextFrame, cols, rows)
					nextFrame++
				}
				if (nextFrame < TOTAL_FRAMES) {
					setTimeout(generateChunk, 0)
				}
			}
			generateChunk()
		}

		const ro = new ResizeObserver(() => rebuildFrames())
		ro.observe(container)
		rebuildFrames()

		const gen = genRef
		return () => {
			gen.current++
			ro.disconnect()
		}
	}, [])

	// Playback loop — runs once, always indexes by frameIdx % TOTAL_FRAMES
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
