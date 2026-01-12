'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { Contributor } from '@/components/contributor'
import config from '@/config'
import { env } from '@/env.mjs'
import type { MinimalWorkshop } from '@/lib/workshops'
import { useInView } from 'framer-motion'
import { useMeasure } from 'react-use'

import type { ProductType } from '@coursebuilder/core/schemas'
import { Button, ScrollArea } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export const WorkshopSidebar = ({
	children,
	sticky = true,
	workshop,
	className,
	productType,
}: {
	children: React.ReactNode
	sticky?: boolean
	workshop?: MinimalWorkshop | null
	className?: string
	productType?: ProductType
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
				className={cn('scroll-mt-15 relative flex h-full flex-col')}
			>
				<div
					ref={sidebarRef}
					className={cn(
						'bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1',
						{
							'md:sticky md:top-5': true,
						},
						className,
					)}
				>
					<ScrollArea className="[&_[data-slot='scroll-area-thumb']]:bg-foreground/20 relative h-full md:max-h-[calc(100vh-40px)] [&_[data-slot='scroll-area-scrollbar']]:opacity-100">
						{children}

						{!Boolean(windowHeight - 40 > height) && (
							<div className="from-card pointer-events-none absolute bottom-0 left-0 z-50 hidden h-20 w-full bg-gradient-to-t to-transparent md:block" />
						)}
					</ScrollArea>
				</div>
			</div>
			{productType === 'self-paced' && (
				<WorkshopSidebarMobile
					className={cn({
						'pointer-events-none opacity-0': isInView,
					})}
					workshop={workshop}
				/>
			)}
		</>
	)
}

export const WorkshopSidebarMobile = ({
	workshop,
	className,
}: {
	workshop?: MinimalWorkshop | null
	className?: string
}) => {
	const { fields } = workshop ?? {}

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
				'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between gap-5 border-t px-4 py-2 transition-opacity duration-300 md:hidden',
				className,
			)}
		>
			<div className="flex flex-col gap-0.5">
				<h3 className="font-heading w-auto truncate text-sm font-semibold">
					{fields?.title}
				</h3>
				<Contributor className="gap-1 [&_img]:w-5 [&_span]:text-xs" />
				{/* <p className="text-sm opacity-75">{config.author}</p> */}
			</div>
			<Button
				asChild
				className="dark:bg-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
			>
				<Link href="#buy" onClick={handleScrollToBuy}>
					Enroll
				</Link>
			</Button>
		</div>
	)
}
