'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import type { Cohort } from '@/lib/cohort'
import { cn } from '@/utils/cn'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { useInView } from 'framer-motion'
import { useMeasure } from 'react-use'

import { Button, ScrollArea } from '@coursebuilder/ui'

export const CohortSidebar = ({
	children,

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
				className="dark:bg-muted/50 scroll-mt-15 relative flex w-full flex-col gap-3 border-t bg-white md:max-w-sm md:border-l lg:border-t-0"
			>
				<div
					ref={sidebarRef}
					className={cn('', {
						'md:top-(--nav-height) md:sticky': true, // sticky && windowHeight - 63 > height,
						'': true, // scrollable
					})}
				>
					<ScrollArea className="h-full lg:max-h-[calc(100vh-var(--nav-height))] [&_[data-slot='scroll-area-scrollbar']]:opacity-50">
						{children}
						{!Boolean(windowHeight - 63 > height) && (
							<div className="from-card pointer-events-none absolute bottom-0 left-0 hidden h-20 w-full bg-gradient-to-t to-transparent lg:block" />
						)}
					</ScrollArea>
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
				'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between gap-5 border-t px-5 py-4 shadow-2xl transition-opacity duration-300 md:hidden',
				className,
			)}
		>
			<div className="flex flex-col">
				<p className="text-muted-foreground text-xs">{eventDateString}</p>
				<p className="text-foreground text-balance text-sm font-semibold">
					{fields.title}
				</p>
			</div>
			<Button className="dark:bg-primary rounded-lg bg-blue-600 shadow" asChild>
				<Link href="#buy" onClick={handleScrollToBuy}>
					Enroll Now
				</Link>
			</Button>
		</div>
	)
}
