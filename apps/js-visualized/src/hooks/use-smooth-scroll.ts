import * as React from 'react'

const useSmoothScroll = () => {
	const scrollToElement = React.useCallback(
		(elementId: string, offset: number = 100) => {
			const element = document.getElementById(elementId)
			if (element) {
				const elementPosition = element.getBoundingClientRect().top
				const offsetPosition = elementPosition + window.pageYOffset - offset

				window.scrollTo({
					top: offsetPosition,
					behavior: 'smooth',
				})
			}
		},
		[],
	)

	return scrollToElement
}

export default useSmoothScroll
