'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import type { Cohort } from '@/lib/cohort'
import { cn } from '@/utils/cn'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { useInView } from 'framer-motion'
import { useMeasure } from 'react-use'

import { Button } from '@coursebuilder/ui'

export const CohortSidebar = ({
	children,
	sticky = true,
	cohort,
}: {
	children: React.ReactNode
	sticky?: boolean
	cohort: Cohort
}) => {
	const [sidebarRef, { height }] = useMeasure<HTMLDivElement>()
	const buySectionRef = useRef<HTMLDivElement>(null)
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
	const isInView = useInView(buySectionRef, { margin: '0px 0px 0% 0px' })

	const handleScrollToBuy = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault()
		buySectionRef.current?.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	}

	return (
		<>
			<div
				ref={buySectionRef}
				id="buy"
				className="dark:bg-muted/50 relative flex w-full flex-col gap-3 bg-white md:max-w-sm md:border-l"
			>
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

			<CohortSidebarMobile
				className={cn({
					'pointer-events-none opacity-0': isInView,
				})}
				cohort={cohort}
			/>
		</>
	)
}

export const CohortSidebarMobile = ({
	cohort,
	className,
}: {
	cohort: Cohort
	className?: string
}) => {
	const { fields } = cohort
	const { startsAt, endsAt, timezone } = fields

	const { dateString: eventDateString, timeString: eventTimeString } =
		formatCohortDateRange(startsAt, endsAt, timezone)

	const handleScrollToBuy = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault()
		const buySection = document.getElementById('buy')
		buySection?.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	}

	return (
		<div
			className={cn(
				'bg-background/90 fixed bottom-0 left-0 z-20 flex w-full items-center justify-between border-t px-5 py-4 backdrop-blur-sm transition-opacity duration-300 md:hidden',
				className,
			)}
		>
			<p>{eventDateString}</p>
			<Button asChild>
				<Link href="#buy" onClick={handleScrollToBuy}>
					Enroll today
				</Link>
			</Button>
		</div>
	)
}
