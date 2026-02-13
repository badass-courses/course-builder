'use client'

import { useEffect, useRef } from 'react'

export function FpsCounter() {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		let frames = 0
		let lastTime = performance.now()
		let rafId: number

		function tick(now: number) {
			frames++
			const delta = now - lastTime
			if (delta >= 500) {
				const fps = Math.round((frames * 1000) / delta)
				if (ref.current) ref.current.textContent = `${fps} fps`
				frames = 0
				lastTime = now
			}
			rafId = requestAnimationFrame(tick)
		}

		rafId = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(rafId)
	}, [])

	return (
		<div
			ref={ref}
			className="pointer-events-none fixed right-3 top-3 z-50 select-none font-mono text-[10px] text-white/30"
		/>
	)
}
