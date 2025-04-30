import React from 'react'

/**
 * Hook to determine if the screen width is below a certain threshold (768px).
 * Updates dynamically on window resize.
 *
 * @returns {boolean} True if the screen width is less than 768px, false otherwise.
 */
export function useIsSmallScreen() {
	// Initialize state based on the current window width or default to false if window is not available (SSR).
	const [isSmallScreen, setIsSmallScreen] = React.useState(
		typeof window !== 'undefined' ? window.innerWidth < 768 : false,
	)

	React.useEffect(() => {
		// Ensure this effect runs only on the client side.
		if (typeof window === 'undefined') return

		// Handler to update the state based on window width.
		const handleResize = () => {
			setIsSmallScreen(window.innerWidth < 768)
		}

		// Set the initial state correctly after hydration on the client.
		handleResize()

		// Add event listener for window resize.
		window.addEventListener('resize', handleResize)

		// Cleanup function to remove the event listener.
		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, []) // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount.

	return isSmallScreen
}
