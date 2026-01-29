'use client'

import React, { useEffect, useRef } from 'react'

interface NoiseProps {
	patternSize?: number
	patternScaleX?: number
	patternScaleY?: number
	patternAlpha?: number
}

const Noise: React.FC<NoiseProps> = ({
	patternSize = 250,
	patternScaleX = 1,
	patternScaleY = 1,
	patternAlpha = 20,
}) => {
	const grainRef = useRef<HTMLCanvasElement | null>(null)

	useEffect(() => {
		const canvas = grainRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const patternCanvas = document.createElement('canvas')
		patternCanvas.width = patternSize
		patternCanvas.height = patternSize
		const patternCtx = patternCanvas.getContext('2d')
		if (!patternCtx) return

		const patternData = patternCtx.createImageData(patternSize, patternSize)
		const patternPixelDataLength = patternSize * patternSize * 4

		// Generate static noise pattern once
		for (let i = 0; i < patternPixelDataLength; i += 4) {
			const value = Math.random() * 255
			patternData.data[i] = value
			patternData.data[i + 1] = value
			patternData.data[i + 2] = value
			patternData.data[i + 3] = patternAlpha
		}
		patternCtx.putImageData(patternData, 0, 0)

		const drawGrain = () => {
			if (!canvas) return
			canvas.width = window.innerWidth * window.devicePixelRatio
			canvas.height = window.innerHeight * window.devicePixelRatio

			ctx.scale(patternScaleX, patternScaleY)

			ctx.clearRect(0, 0, canvas.width, canvas.height)
			const pattern = ctx.createPattern(patternCanvas, 'repeat')
			if (pattern) {
				ctx.fillStyle = pattern
				ctx.fillRect(0, 0, canvas.width, canvas.height)
			}
		}

		window.addEventListener('resize', drawGrain)
		drawGrain()

		return () => {
			window.removeEventListener('resize', drawGrain)
		}
	}, [patternSize, patternScaleX, patternScaleY, patternAlpha])

	return (
		<canvas
			className="pointer-events-none fixed left-0 top-0 h-screen w-screen"
			ref={grainRef}
		/>
	)
}

export default Noise
