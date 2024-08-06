import * as React from 'react'

const useSmoothScroll = () => {
	const scrollToElement = React.useCallback(
		(elementId: string, duration: number = 1000, offset: number = 100) => {
			const element = document.getElementById(elementId)
			if (!element) return

			const startPosition = window.scrollY
			const targetPosition =
				element.getBoundingClientRect().top + window.scrollY - offset
			const distance = targetPosition - startPosition
			let startTime: number | null = null

			const animation = (currentTime: number) => {
				if (startTime === null) startTime = currentTime
				const timeElapsed = currentTime - startTime
				const run = easeInOutQuad(
					timeElapsed,
					startPosition,
					distance,
					duration,
				)
				window.scrollTo(0, run)
				if (timeElapsed < duration) requestAnimationFrame(animation)
			}

			// Easing function
			const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
				t /= d / 2
				if (t < 1) return (c / 2) * t * t + b
				t--
				return (-c / 2) * (t * (t - 2) - 1) + b
			}

			requestAnimationFrame(animation)
		},
		[],
	)

	return scrollToElement
}

export default useSmoothScroll
