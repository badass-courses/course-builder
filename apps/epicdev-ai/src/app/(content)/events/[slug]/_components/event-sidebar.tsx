'use client'

import React from 'react'
import { cn } from '@/utils/cn'

export const EventSidebar = ({ children }: { children: React.ReactNode }) => {
	const sidebarRef = React.useRef<HTMLDivElement>(null)
	const [sidebarHeight, setSidebarHeight] = React.useState(0)
	const [windowHeight, setWindowHeight] = React.useState(0)

	React.useEffect(() => {
		const element = sidebarRef.current
		if (!element) return

		const observer = new ResizeObserver(() => {
			setSidebarHeight(element.clientHeight)
		})

		observer.observe(element)
		setSidebarHeight(element.clientHeight) // Initial set

		return () => {
			observer.unobserve(element)
			observer.disconnect()
		}
	}, []) // Empty dependency array is correct for ResizeObserver setup

	React.useEffect(() => {
		const handleResize = () => {
			setWindowHeight(window.innerHeight - 40) // Assuming 90px is for a fixed header/nav
		}
		handleResize()
		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [])

	return (
		<div
			data-event=""
			id="buy"
			className="col-span-4 pt-0" // This parent might need to be scrollable or allow overflow
		>
			{/* The direct child is now the sticky element */}

			<div
				ref={sidebarRef}
				className={cn(
					'dark:bg-foreground/5 dark:border-foreground/10 bg-card self-start rounded-md border shadow-xl', // Base classes
					{
						'sticky top-6': windowHeight > sidebarHeight, // Conditional sticky
					},
				)}
			>
				{children}
			</div>
		</div>
	)
}
