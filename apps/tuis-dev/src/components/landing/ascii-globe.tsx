'use client'

import { useEffect, useRef, useState } from 'react'

const COLS = 80
const ROWS = 30
const TOTAL_FRAMES = 200
const ASPECT = 1.7
const RADIUS = 15
const CX = COLS / 2
const CY = ROWS / 2
const CHAR_RAMP = ' .:-=+*#%@'

// Tailwind classes for each intensity level (must appear literally for scanner)
const gClass = [
	'',
	'text-white/10',
	'text-white/20',
	'text-white/30',
	'text-white/40',
	'text-white/50',
	'text-white/60',
	'text-white/70',
	'text-white/80',
	'text-white/90',
]

// Simple seeded noise (no deps needed) using sin-based hash
function hash(x: number, y: number): number {
	const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
	return h - Math.floor(h)
}

function smoothNoise(x: number, y: number): number {
	const ix = Math.floor(x)
	const iy = Math.floor(y)
	const fx = x - ix
	const fy = y - iy
	const sx = fx * fx * (3 - 2 * fx)
	const sy = fy * fy * (3 - 2 * fy)
	const a = hash(ix, iy)
	const b = hash(ix + 1, iy)
	const c = hash(ix, iy + 1)
	const d = hash(ix + 1, iy + 1)
	return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

function fbm(x: number, y: number): number {
	let v = 0
	v += smoothNoise(x * 1.5, y * 1.5) * 0.5
	v += smoothNoise(x * 3, y * 3) * 0.25
	v += smoothNoise(x * 6, y * 6) * 0.125
	return v
}

// Light direction (upper-right)
const lx = 0.5 / Math.sqrt(0.98)
const ly = -0.3 / Math.sqrt(0.98)
const lz = 0.8 / Math.sqrt(0.98)

function generateFrame(f: number): string {
	const rotAngle = (f / TOTAL_FRAMES) * Math.PI * 2
	const cosR = Math.cos(rotAngle)
	const sinR = Math.sin(rotAngle)
	const tilt = 0.3
	const cosT = Math.cos(tilt)
	const sinT = Math.sin(tilt)

	const lines: string[] = []

	for (let row = 0; row < ROWS; row++) {
		const parts: string[] = []
		for (let col = 0; col < COLS; col++) {
			const sx = (col - CX) / RADIUS
			const sy = ((row - CY) * ASPECT) / RADIUS
			const r2 = sx * sx + sy * sy

			if (r2 > 1.0) {
				parts.push(' ')
				continue
			}

			const sz = Math.sqrt(1.0 - r2)
			const diffuse = Math.max(0, sx * lx + sy * ly + sz * lz)

			const rx = sx * cosR + sz * sinR
			const rz = -sx * sinR + sz * cosR
			const ty = sy * cosT - rz * sinT
			const tz = sy * sinT + rz * cosT

			const lon = Math.atan2(rx, tz)
			const lat = Math.asin(Math.max(-1, Math.min(1, ty)))

			const px = Math.cos(lat) * Math.cos(lon)
			const py = Math.cos(lat) * Math.sin(lon)
			const pz = Math.sin(lat)
			const terrain = fbm(px * 2 + pz, py * 2 + pz)

			const isLand = terrain > 0.35
			const base = isLand ? 0.5 + terrain * 0.5 : 0.15 + terrain * 0.3
			let intensity = base * (0.3 + diffuse * 0.7)

			intensity += (1.0 - sz) * 0.15
			const lonGrid = Math.abs(Math.sin(lon * 6))
			const latGrid = Math.abs(Math.sin(lat * 6))
			if (lonGrid < 0.04 || latGrid < 0.04) intensity += 0.15

			intensity = Math.max(0, Math.min(1, intensity))
			const ci = Math.floor(intensity * (CHAR_RAMP.length - 1))
			const ch = CHAR_RAMP[ci]

			if (ci <= 0) {
				parts.push(' ')
			} else {
				parts.push(`<span class="${gClass[ci]}">${ch}</span>`)
			}
		}
		lines.push(parts.join(''))
	}
	return lines.join('\n')
}

export function AsciiGlobe() {
	const preRef = useRef<HTMLPreElement>(null)
	const framesRef = useRef<string[]>([])
	const [ready, setReady] = useState(false)

	// Generate frames in chunks via setTimeout
	useEffect(() => {
		const frames = framesRef.current
		let nextFrame = 0
		let cancelled = false

		function generateChunk() {
			if (cancelled) return
			const deadline = performance.now() + 8 // 8ms budget per chunk
			while (nextFrame < TOTAL_FRAMES && performance.now() < deadline) {
				frames[nextFrame] = generateFrame(nextFrame)
				nextFrame++
			}
			if (nextFrame < TOTAL_FRAMES) {
				setTimeout(generateChunk, 0)
			} else {
				setReady(true)
			}
		}

		generateChunk()
		return () => {
			cancelled = true
		}
	}, [])

	// Animation loop — starts as soon as first frame exists
	useEffect(() => {
		const frames = framesRef.current
		if (frames.length === 0) return

		let frameIdx = 0
		let lastTime = 0
		const interval = 1000 / 16
		let rafId: number

		function tick(time: number) {
			if (time - lastTime >= interval) {
				lastTime = time
				const maxIdx = ready ? frames.length : Math.max(1, frames.length)
				if (preRef.current && frames[frameIdx % maxIdx]) {
					preRef.current.innerHTML = frames[frameIdx % maxIdx]!
				}
				frameIdx =
					(frameIdx + 1) % (ready ? TOTAL_FRAMES : Math.max(1, frames.length))
			}
			rafId = requestAnimationFrame(tick)
		}

		rafId = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(rafId)
	}, [ready])

	return (
		<div className="flex aspect-square h-full w-full items-center justify-center">
			<pre
				ref={preRef}
				className="m-0 select-none whitespace-pre p-0 font-mono text-[11px] leading-[1.15] tracking-[0.05em]"
			/>
		</div>
	)
}
