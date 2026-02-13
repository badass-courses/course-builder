import React from 'react'

export function useIsMobile({ breakpoint = 768 }: { breakpoint?: number }) {
	const [isMobile, setIsMobile] = React.useState(false)

	React.useEffect(() => {
		if (typeof window !== 'undefined') {
			const handleResize = () => {
				setIsMobile(window.innerWidth < breakpoint)
			}

			handleResize() // Check on initial render

			window.addEventListener('resize', handleResize)

			return () => {
				window.removeEventListener('resize', handleResize)
			}
		}
	}, [breakpoint])

	return isMobile
}
