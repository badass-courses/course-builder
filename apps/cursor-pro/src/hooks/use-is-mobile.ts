import React from 'react'

export function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState(false)

	React.useEffect(() => {
		if (typeof window !== 'undefined') {
			const handleResize = () => {
				setIsMobile(window.innerWidth < 768)
			}

			handleResize() // Check on initial render

			window.addEventListener('resize', handleResize)

			return () => {
				window.removeEventListener('resize', handleResize)
			}
		}
	}, [])

	return isMobile
}
