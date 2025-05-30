'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import { useMeasure } from 'react-use'

export const CohortSidebar = ({
	children,
	sticky = true,
}: {
	children: React.ReactNode
	sticky?: boolean
}) => {
	const [sidebarRef, { height }] = useMeasure<HTMLDivElement>()
	console.log(height)
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
		<div className="dark:bg-muted/50 relative flex w-full flex-col gap-3 bg-white md:max-w-sm md:border-l">
			<div
				ref={sidebarRef}
				className={cn('', {
					'md:sticky md:top-[var(--nav-height)]':
						sticky && windowHeight - 63 > height,
				})}
			>
				{children}
			</div>
		</div>
	)
}
