'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Event } from '@/lib/events'
import { cn } from '@/utils/cn'
import { formatInTimeZone } from 'date-fns-tz'
import { useInView } from 'framer-motion'
import { useMeasure } from 'react-use'

import { Button, ScrollArea } from '@coursebuilder/ui'

/**
 * Sidebar component for event pages with sticky behavior and mobile bottom bar
 */
export const EventSidebar = ({
	children,
	event,
	isSoldOut,
	hasPurchased,
}: {
	children: React.ReactNode
	event: Event
	isSoldOut?: boolean
	hasPurchased?: boolean
}) => {
	const [sidebarRef, { height }] = useMeasure<HTMLDivElement>()
	const [windowHeight, setWindowHeight] = useState(0)
	const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)
	const buySectionRef = useRef<HTMLDivElement>(null)
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(buySectionRef, { margin: '0px 0px 0% 0px' })

	useEffect(() => {
		const scrollArea = scrollAreaRef.current
		const viewport = scrollArea?.querySelector<HTMLElement>(
			'[data-slot="scroll-area-viewport"]',
		)
		if (!viewport) return

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = viewport
			const atBottom = scrollTop + clientHeight >= scrollHeight - 10
			setIsScrolledToBottom(atBottom)
		}

		viewport.addEventListener('scroll', handleScroll)
		return () => viewport.removeEventListener('scroll', handleScroll)
	}, [])

	useEffect(() => {
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
						'md:top-(--nav-height) md:sticky': true,
					})}
				>
					<ScrollArea
						ref={scrollAreaRef}
						className="h-full lg:max-h-[calc(100vh-var(--nav-height))] [&_[data-slot='scroll-area-scrollbar']]:opacity-50"
					>
						{children}
						{!Boolean(windowHeight - 63 > height) && !isScrolledToBottom && (
							<div className="from-card pointer-events-none absolute bottom-0 left-0 hidden h-20 w-full bg-gradient-to-t to-transparent lg:block" />
						)}
					</ScrollArea>
				</div>
			</div>

			<EventSidebarMobile
				className={cn({
					'pointer-events-none opacity-0': isInView,
				})}
				event={event}
				isSoldOut={isSoldOut}
				hasPurchased={hasPurchased}
			/>
		</>
	)
}

/**
 * Mobile bottom bar for event pages that appears when sidebar scrolls out of view
 */
export const EventSidebarMobile = ({
	event,
	className,
	isSoldOut,
	hasPurchased,
}: {
	event: Event
	className?: string
	isSoldOut?: boolean
	hasPurchased?: boolean
}) => {
	const { fields } = event
	const { startsAt, endsAt, timezone } = fields
	const PT = timezone || 'America/Los_Angeles'

	const eventDate =
		startsAt && formatInTimeZone(new Date(startsAt), PT, 'MMMM d, yyyy')

	const handleScrollToBuy = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault()
		const buySection = document.getElementById('buy')
		buySection?.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	}

	const buttonText = hasPurchased
		? 'View Details'
		: isSoldOut
			? 'Join Waitlist'
			: 'Get Ticket'

	return (
		<div
			className={cn(
				'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between gap-5 border-t px-5 py-3 shadow-2xl transition-opacity duration-300 lg:hidden',
				className,
			)}
		>
			<div className="flex flex-col">
				<p className="text-muted-foreground text-xs sm:text-sm">{eventDate}</p>
				<p className="text-foreground text-balance text-sm font-semibold sm:text-base">
					{fields.title}
				</p>
			</div>
			<div className="flex flex-col items-end gap-0.5">
				{isSoldOut && !hasPurchased && (
					<span className="text-primary text-xs">Sold Out</span>
				)}
				<Button
					className={cn(
						'relative rounded-xl shadow',
						hasPurchased
							? 'bg-muted text-muted-foreground'
							: 'dark:bg-primary bg-blue-600',
					)}
					asChild
				>
					<Link href="#buy" onClick={handleScrollToBuy}>
						<span className="relative z-10">{buttonText}</span>
						{!hasPurchased && (
							<div
								style={{
									backgroundSize: '200% 100%',
								}}
								className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
							/>
						)}
					</Link>
				</Button>
			</div>
		</div>
	)
}
