'use client'

import { useEffect } from 'react'
import { animate } from 'motion'

type ColorStop = {
	h: number // hue 0-360
	l: number // lightness 0-1
	c: number // chroma 0-0.4 (higher = more saturated)
}

// Define color stops - tweak l/c per hue for best appearance
const COLORS: ColorStop[] = [
	{ h: 10, l: 0.65, c: 0.2 },
	// { h: 10, l: 0.7, c: 0.18 },
]

const DURATION_PER_COLOR = 3 // seconds

export function HueShift() {
	useEffect(() => {
		let index = 0
		let animation: { stop: () => void } | null = null

		const setColor = (h: number, l: number, c: number) => {
			const root = document.documentElement
			root.style.setProperty('--primary-hue', String(h))
			root.style.setProperty('--primary-lightness', String(l))
			root.style.setProperty('--primary-chroma', String(c))
		}

		const shiftToNext = () => {
			const from = COLORS[index]!
			index = (index + 1) % COLORS.length
			const to = COLORS[index]!

			// Handle hue wrap-around (330 -> 30 goes through red)
			let toH = to.h
			if (Math.abs(to.h - from.h) > 180) {
				toH = to.h > from.h ? to.h - 360 : to.h + 360
			}

			// Animate all three values together using progress 0-1
			animation = animate(0, 1, {
				duration: DURATION_PER_COLOR,
				ease: 'easeInOut',
				onUpdate: (progress) => {
					const h = from.h + (toH - from.h) * progress
					const l = from.l + (to.l - from.l) * progress
					const c = from.c + (to.c - from.c) * progress
					// Normalize hue to 0-360
					const normalizedH = ((h % 360) + 360) % 360
					setColor(normalizedH, l, c)
				},
				onComplete: shiftToNext,
			})
		}

		// Set initial color
		setColor(COLORS[0]!.h, COLORS[0]!.l, COLORS[0]!.c)
		shiftToNext()

		return () => animation?.stop()
	}, [])

	return null
}
