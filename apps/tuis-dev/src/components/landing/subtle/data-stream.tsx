'use client'

import { useEffect, useRef } from 'react'
import { setIntervalOnVisible } from '@/utils/set-timeout-on-visible'

const COLS = 28
const FRAMES = 28
const G = `<span class="text-[#C0FFBD]/50">`

type Pipe = {
	base: string
	packets: { start: number; len: number }[]
	speed: number
}

const pipes: Pipe[] = [
	{
		base: '─',
		packets: [
			{ start: 0, len: 3 },
			{ start: 16, len: 2 },
		],
		speed: 1,
	},
	{ base: '═', packets: [{ start: 5, len: 4 }], speed: -2 },
	{
		base: '─',
		packets: [
			{ start: 10, len: 2 },
			{ start: 22, len: 3 },
		],
		speed: 2,
	},
	{
		base: '═',
		packets: [
			{ start: 3, len: 3 },
			{ start: 18, len: 2 },
		],
		speed: -1,
	},
	{
		base: '─',
		packets: [
			{ start: 7, len: 2 },
			{ start: 20, len: 4 },
		],
		speed: 1,
	},
]

const frames: string[] = (() => {
	const out: string[] = []

	for (let f = 0; f < FRAMES; f++) {
		const lines: string[] = []

		for (const pipe of pipes) {
			// Build a boolean mask for packet positions
			const isPacket = new Array(COLS).fill(false)
			for (const pkt of pipe.packets) {
				for (let k = 0; k < pkt.len; k++) {
					const pos = (((pkt.start + pipe.speed * f + k) % COLS) + COLS) % COLS
					isPacket[pos] = true
				}
			}

			// Render line with green-accented packets
			let html = ''
			let i = 0
			while (i < COLS) {
				if (isPacket[i]) {
					let j = i
					while (j < COLS && isPacket[j]) j++
					html += `${G}${'▪'.repeat(j - i)}</span>`
					i = j
				} else {
					let j = i
					while (j < COLS && !isPacket[j]) j++
					html += pipe.base.repeat(j - i)
					i = j
				}
			}
			lines.push(html)
		}

		out.push(lines.join('\n'))
	}
	return out
})()

export function SubtleDataStream({
	className = '',
	interval = 100,
}: {
	className?: string
	interval?: number
}) {
	const ref = useRef<HTMLDivElement>(null)

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
			style={{ fontSize: '10px', lineHeight: '1.4', letterSpacing: '0.05em' }}
		/>
	)
}
