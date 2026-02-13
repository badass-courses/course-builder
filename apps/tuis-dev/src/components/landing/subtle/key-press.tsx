'use client'

import { useEffect, useRef } from 'react'
import { setIntervalOnVisible } from '@/utils/set-timeout-on-visible'

const ROWS = 9
const COLS = 14

type Pos = [number, number]
type Dir = [number, number]

const DIRS: Dir[] = [
	[0, 1], // right
	[1, 0], // down
	[0, -1], // left
	[-1, 0], // up
]

function eq(a: Pos, b: Pos) {
	return a[0] === b[0] && a[1] === b[1]
}

function wrap(p: Pos): Pos {
	return [((p[0] % ROWS) + ROWS) % ROWS, ((p[1] % COLS) + COLS) % COLS]
}

function occupied(snake: Pos[], p: Pos) {
	return snake.some((s) => eq(s, p))
}

// Simple seeded RNG for deterministic replay
function mulberry32(seed: number) {
	return () => {
		seed |= 0
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

function placeFood(snake: Pos[], rng: () => number): Pos {
	let p: Pos
	do {
		p = [Math.floor(rng() * ROWS), Math.floor(rng() * COLS)]
	} while (occupied(snake, p))
	return p
}

// Pick best direction toward food, avoiding self
function chooseDir(head: Pos, food: Pos, snake: Pos[], currentDir: Dir): Dir {
	// Score each direction
	const scored = DIRS.map((d) => {
		const next = wrap([head[0] + d[0], head[1] + d[1]])
		// Can't reverse into yourself
		if (d[0] === -currentDir[0] && d[1] === -currentDir[1] && snake.length > 1)
			return { d, score: -1000 }
		// Can't go into own body
		if (occupied(snake, next)) return { d, score: -500 }
		// Manhattan distance to food (on torus)
		const dr = Math.min(
			Math.abs(next[0] - food[0]),
			ROWS - Math.abs(next[0] - food[0]),
		)
		const dc = Math.min(
			Math.abs(next[1] - food[1]),
			COLS - Math.abs(next[1] - food[1]),
		)
		return { d, score: -(dr + dc) }
	}).sort((a, b) => b.score - a.score)

	return scored[0]!.d
}

const MAX_LEN = 12

function simulate() {
	const rng = mulberry32(42)
	const frames: string[] = []
	let snake: Pos[] = [
		[4, 3],
		[4, 2],
		[4, 1],
	]
	let dir: Dir = [0, 1]
	let food = placeFood(snake, rng)
	let maxLen = 3

	for (let f = 0; f < 200; f++) {
		// render
		const grid: string[][] = Array.from({ length: ROWS }, () =>
			new Array(COLS).fill('· '),
		)

		// food
		grid[food[0]]![food[1]] = `<span class="text-white/50">◆ </span>`

		// body
		for (let i = 1; i < snake.length; i++) {
			grid[snake[i]![0]]![snake[i]![1]] = '◼︎ '
		}

		// head
		const [hr, hc] = snake[0]!
		grid[hr]![hc] = `<span class="text-[#C0FFBD]">◼︎ </span>`

		frames.push(grid.map((row) => row.join('')).join('\n'))

		// move
		dir = chooseDir(snake[0]!, food, snake, dir)
		const next = wrap([snake[0]![0] + dir[0], snake[0]![1] + dir[1]])

		// check self-collision → reset
		if (occupied(snake.slice(1), next)) {
			snake = [next]
			maxLen = 3
			food = placeFood(snake, rng)
			continue
		}

		snake.unshift(next)

		if (eq(next, food)) {
			maxLen = Math.min(maxLen + 1, MAX_LEN)
			food = placeFood(snake, rng)
		}

		while (snake.length > maxLen) snake.pop()
	}

	return frames
}

const precomputedFrames = simulate()

export function SubtleKeyPress({
	className = '',
	interval = 140,
}: {
	className?: string
	interval?: number
}) {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		let i = 0
		const animate = () => {
			if (ref.current) {
				ref.current.innerHTML = precomputedFrames[i % precomputedFrames.length]!
				i++
			}
		}
		animate()
		const cleanup = setIntervalOnVisible({
			element: ref.current,
			callback: animate,
			interval,
		})
		return () => {
			cleanup?.()
		}
	}, [])

	return (
		<div
			ref={ref}
			className={`select-none whitespace-pre font-mono text-white/20 ${className}`}
			style={{ fontSize: '11px', lineHeight: '1.5' }}
		/>
	)
}
