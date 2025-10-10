'use client'

import React from 'react'
import { cn } from '@/utils/cn'

export const EventSidebar = ({ children }: { children: React.ReactNode }) => {
	const sidebarRef = React.useRef<HTMLDivElement>(null)

	// get sidebar height
	const [sidebarHeight, setSidebarHeight] = React.useState(0)
	React.useEffect(() => {
		if (sidebarRef.current) {
			setSidebarHeight(sidebarRef.current.clientHeight)
		}
	}, [sidebarRef.current])

	// get window height
	const [windowHeight, setWindowHeight] = React.useState(0)
	React.useEffect(() => {
		const handleResize = () => {
			setWindowHeight(window.innerHeight)
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
			className="relative flex w-full flex-col gap-3 border-l md:max-w-sm"
		>
			<div
				ref={sidebarRef}
				className={cn('', {
					'md:sticky md:top-0': windowHeight > sidebarHeight,
				})}
			>
				{children}
			</div>
		</div>
	)
}
