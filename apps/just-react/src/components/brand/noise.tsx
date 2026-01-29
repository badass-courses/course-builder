'use client'

import React, { useEffect, useRef } from 'react'

interface NoiseProps {
	patternSize?: number
	patternScaleX?: number
	patternScaleY?: number
	patternRefreshInterval?: number
	patternAlpha?: number
}

const Noise: React.FC<NoiseProps> = ({
	patternSize = 250,
	patternScaleX = 1,
	patternScaleY = 1,
	patternRefreshInterval = 0,
	patternAlpha = 15,
}) => {
	const grainRef = useRef<HTMLCanvasElement | null>(null)

	useEffect(() => {
		const canvas = grainRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		let frame = 0

		const patternCanvas = document.createElement('canvas')
		patternCanvas.width = patternSize
		patternCanvas.height = patternSize
		const patternCtx = patternCanvas.getContext('2d')
		if (!patternCtx) return

		const patternData = patternCtx.createImageData(patternSize, patternSize)
		const patternPixelDataLength = patternSize * patternSize * 4

		const resize = () => {
			if (!canvas) return
			canvas.width = window.innerWidth * window.devicePixelRatio
			canvas.height = window.innerHeight * window.devicePixelRatio

			ctx.scale(patternScaleX, patternScaleY)
		}

		const updatePattern = () => {
			for (let i = 0; i < patternPixelDataLength; i += 4) {
				const value = Math.random() * 255
				patternData.data[i] = value
				patternData.data[i + 1] = value
				patternData.data[i + 2] = value
				patternData.data[i + 3] = patternAlpha
			}
			patternCtx.putImageData(patternData, 0, 0)
		}

		const drawGrain = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			const pattern = ctx.createPattern(patternCanvas, 'repeat')
			if (pattern) {
				ctx.fillStyle = pattern
				ctx.fillRect(0, 0, canvas.width, canvas.height)
			}
		}

		const loop = () => {
			if (frame % patternRefreshInterval === 0) {
				updatePattern()
				drawGrain()
			}
			frame++
			window.requestAnimationFrame(loop)
		}

		window.addEventListener('resize', resize)
		resize()
		loop()

		return () => {
			window.removeEventListener('resize', resize)
		}
	}, [
		patternSize,
		patternScaleX,
		patternScaleY,
		patternRefreshInterval,
		patternAlpha,
	])

	return (
		<canvas
			className="pointer-events-none fixed left-0 top-0 h-screen w-screen"
			ref={grainRef}
		/>
	)
}

export default Noise
