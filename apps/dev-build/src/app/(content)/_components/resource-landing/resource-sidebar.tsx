'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { useInView } from 'framer-motion'
import { useMeasure } from 'react-use'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

/**
 * Configuration for the mobile CTA bar that appears when sidebar scrolls out of view.
 */
export type MobileCtaConfig = {
	/** Main title text */
	title: string
	/** Optional subtitle/description - can be string or custom ReactNode */
	subtitle?: React.ReactNode
	/** Button text */
	buttonText: string
	/** Button href - defaults to #buy for scroll */
	buttonHref?: string
}

export type ResourceSidebarProps = {
	children: React.ReactNode
	/** Enable sticky positioning - defaults to true */
	sticky?: boolean
	/** Additional CSS classes */
	className?: string
	/** Container CSS classes for the outer wrapper */
	containerClassName?: string
	/** Mobile CTA configuration - if provided, shows a fixed mobile bar */
	mobileCta?: MobileCtaConfig
	/** Custom mobile CTA renderer for complex cases (overrides mobileCta) */
	renderMobileCta?: (props: { isInView: boolean }) => React.ReactNode
}

/**
 * Unified sticky sidebar component for resource landing pages.
 *
 * Consolidates the patterns from:
 * - EventSidebar
 * - WorkshopSidebar
 * - CohortSidebar
 *
 * Features:
 * - Sticky positioning that respects viewport height
 * - Optional mobile CTA bar that appears when sidebar scrolls out of view
 * - Consistent styling across all resource pages
 */
export function ResourceSidebar({
	children,
	sticky = true,
	className,
	containerClassName,
	mobileCta,
	renderMobileCta,
}: ResourceSidebarProps) {
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
				className={cn(
					'relative col-span-4 flex w-full flex-col',
					containerClassName,
				)}
			>
				<div
					ref={sidebarRef}
					className={cn(
						'bg-card border-border overflow-hidden rounded-lg border shadow-sm',
						{
							'md:sticky md:top-5': sticky && windowHeight - 63 > height,
						},
						className,
					)}
				>
					{children}
				</div>
			</div>

			{renderMobileCta ? (
				renderMobileCta({ isInView })
			) : mobileCta ? (
				<ResourceSidebarMobile
					className={cn({
						'pointer-events-none opacity-0': isInView,
					})}
					{...mobileCta}
				/>
			) : null}
		</>
	)
}

/**
 * Mobile CTA bar that appears fixed at bottom of screen.
 * Shows when the main sidebar scrolls out of view.
 */
export function ResourceSidebarMobile({
	title,
	subtitle,
	buttonText,
	buttonHref = '#buy',
	className,
}: MobileCtaConfig & { className?: string }) {
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
				'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between border-t px-5 py-3 transition-opacity duration-300 md:hidden',
				className,
			)}
		>
			<div className="flex flex-col gap-0.5">
				<h3 className="font-heading text-base font-semibold">{title}</h3>
				{subtitle &&
					(typeof subtitle === 'string' ? (
						<p className="text-sm opacity-75">{subtitle}</p>
					) : (
						subtitle
					))}
			</div>
			<Button asChild>
				<Link href={buttonHref} onClick={handleScrollToBuy}>
					{buttonText}
				</Link>
			</Button>
		</div>
	)
}
