'use client'

import { useEffect, useRef } from 'react'

const CHAR_WIDTH = 6.65
const CHAR_HEIGHT = 12.65
const TOTAL_FRAMES = 120

function generateFrame(f: number, cols: number, rows: number, density: number): string {
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

			// density: 0 = nearly empty, 1 = packed
			// bias controls how much of the wave is above zero
			const bias = 0.05 + density * 0.5
			const intensity = Math.max(0, (v + bias) * 0.7)

			if (intensity < 0.08) {
				parts.push(' ')
			} else if (intensity < 0.25) {
				const digit = ((col * 7 + row * 13 + f) % 2).toString()
				parts.push(`<span class="text-white/10">${digit}</span>`)
			} else if (intensity < 0.45) {
				const digit = ((col * 7 + row * 13 + f) % 2).toString()
				parts.push(`<span class="text-white/20">${digit}</span>`)
			} else {
				const digit = ((col * 7 + row * 13 + f) % 2).toString()
				parts.push(`<span class="text-white/40">${digit}</span>`)
			}
		}
		lines.push(parts.join(''))
	}
	return lines.join('\n')
}

export function BinaryField({
	opacity = 50,
	className = '',
	fps = 12,
	density = 0.5,
}: {
	opacity?: number
	className?: string
	fps?: number
	density?: number
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const preRef = useRef<HTMLPreElement>(null)
	const framesRef = useRef<string[]>([])
	const sizeRef = useRef({ cols: 0, rows: 0 })
	const frameIdxRef = useRef(0)
	const genRef = useRef(0)

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		function rebuildFrames() {
			const w = container!.clientWidth
			const h = container!.clientHeight
			if (w === 0 || h === 0) return

			const cols = Math.ceil(w / CHAR_WIDTH)
			const rows = Math.ceil(h / CHAR_HEIGHT)

			if (cols === sizeRef.current.cols && rows === sizeRef.current.rows)
				return

			const gen = ++genRef.current
			sizeRef.current = { cols, rows }
			framesRef.current = []
			frameIdxRef.current = 0

			let nextFrame = 0
			function generateChunk() {
				if (genRef.current !== gen) return
				const deadline = performance.now() + 8
				while (nextFrame < TOTAL_FRAMES && performance.now() < deadline) {
					framesRef.current[nextFrame] = generateFrame(
						nextFrame,
						cols,
						rows,
						density,
					)
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
	}, [density])

	useEffect(() => {
		let lastTime = 0
		const interval = 1000 / fps
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
	}, [fps])

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
