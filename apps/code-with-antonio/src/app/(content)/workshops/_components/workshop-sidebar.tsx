'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { Contributor } from '@/components/contributor'
import config from '@/config'
import { env } from '@/env.mjs'
import type { MinimalWorkshop } from '@/lib/workshops'
import { useInView } from 'framer-motion'
import { useMeasure } from 'react-use'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export const WorkshopSidebar = ({
	children,
	sticky = true,
	workshop,
	className,
}: {
	children: React.ReactNode
	sticky?: boolean
	workshop?: MinimalWorkshop | null
	className?: string
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
				className={cn('relative h-full', className)}
			>
				<div
					ref={sidebarRef}
					className={cn('', {
						'md:top-(--nav-height) md:sticky':
							sticky && windowHeight - 63 > height,
					})}
				>
					{children}
				</div>
			</div>
			<WorkshopSidebarMobile
				className={cn({
					'pointer-events-none opacity-0': isInView,
				})}
				workshop={workshop}
			/>
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
				'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between border-t px-5 py-3 transition-opacity duration-300 md:hidden',
				className,
			)}
		>
			<div className="flex flex-col gap-0.5">
				<h3 className="font-heading text-base font-semibold">
					{fields?.title}
				</h3>
				<Contributor className="gap-1 text-sm [&_img]:w-5" />
				{/* <p className="text-sm opacity-75">{config.author}</p> */}
			</div>
			<Button
				asChild
				className="dark:bg-primary dark:hover:bg-primary bg-blue-600 hover:bg-blue-500"
			>
				<Link href="#buy" onClick={handleScrollToBuy}>
					Start Learning
				</Link>
			</Button>
		</div>
	)
}
