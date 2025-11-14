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
	const [windowHeight, setWindowHeight] = React.useState(0)
	const buySectionRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(buySectionRef, { margin: '0px 0px 0% 0px' })

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
		<>
			<div
				ref={buySectionRef}
				id="buy"
				className="relative col-span-4 flex w-full flex-col"
			>
				<div
					ref={sidebarRef}
					className={cn(
						'bg-card border-border overflow-hidden rounded-lg border shadow-sm',
						{
							'md:sticky md:top-5': sticky && windowHeight - 63 > height,
						},
					)}
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
				'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between border-t px-5 py-4 transition-opacity duration-300 md:hidden',
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
