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
				className="relative flex w-full flex-col gap-3 md:max-w-sm"
			>
				<div
					ref={sidebarRef}
					className={cn(
						'dark:bg-muted-foreground/5 rounded-lg border bg-white shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)] dark:border-transparent',
						{
							'top-3 md:sticky': sticky && windowHeight - 63 > height,
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
				'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between border-t px-5 py-3 shadow-[0px_-8px_38px_-14px_rgba(0,_0,_0,_0.1)] transition-opacity duration-300 md:hidden',
				className,
			)}
		>
			<p className="font-heading text-sm font-medium">{eventDateString}</p>
			<Button asChild>
				<Link
					className="dark:bg-primary font-heading dark:hover:bg-primary/90 from-primary relative cursor-pointer rounded-lg bg-gradient-to-b to-indigo-800 text-base font-semibold tracking-tight shadow-xl transition duration-300 ease-out hover:bg-blue-700 hover:brightness-110"
					href="#buy"
					onClick={handleScrollToBuy}
				>
					<span className="relative z-10 drop-shadow-md dark:text-white">
						Enroll
					</span>
					<div
						style={{
							backgroundSize: '200% 100%',
							animationDuration: '2s',
							animationIterationCount: 'infinite',
							animationTimingFunction: 'linear',
							animationFillMode: 'forwards',
							animationDelay: '2s',
						}}
						className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
					/>
				</Link>
			</Button>
		</div>
	)
}
