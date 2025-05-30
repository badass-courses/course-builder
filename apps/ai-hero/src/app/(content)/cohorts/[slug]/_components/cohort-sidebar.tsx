'use client'

import React from 'react'
import { cn } from '@/utils/cn'

export const CohortSidebar = ({
	children,
	sticky = true,
}: {
	children: React.ReactNode
	sticky?: boolean
}) => {
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
		<div className="bg-muted/50 relative flex w-full flex-col gap-3 md:max-w-sm md:border-l">
			<div
				ref={sidebarRef}
				className={cn('', {
					'md:sticky md:top-[var(--nav-height)]':
						sticky && windowHeight > sidebarHeight,
				})}
			>
				{children}
			</div>
		</div>
	)
}
