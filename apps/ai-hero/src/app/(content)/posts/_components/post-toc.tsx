'use client'

import React from 'react'
import Link from 'next/link'
import { useActiveHeadingContext } from '@/hooks/use-active-heading'
import { extractMarkdownHeadings } from '@/utils/extract-markdown-headings'
import { motion } from 'framer-motion'
import { AlignLeft, ChevronRight } from 'lucide-react'
import { useInteractOutside } from 'react-aria'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export default function PostToC({ markdown }: { markdown: string }) {
	const data = extractMarkdownHeadings(markdown)
	const { activeHeading } = useActiveHeadingContext()
	const [isOpen, setIsOpen] = React.useState(false)
	const containerRef = React.useRef<HTMLElement>(null)

	useInteractOutside({
		ref: containerRef,
		onInteractOutside: () => setIsOpen(false),
	})

	const flattenedData = data
		.flatMap((item) => [item, ...(item.items || [])])
		.flat()

	if (data.length === 0 || flattenedData.length <= 3) {
		return null
	}

	return (
		<nav
			ref={containerRef}
			className="bg-background sticky top-[63px] z-50 mt-5 flex min-w-[200px] flex-col border-y "
			aria-label="On this page"
		>
			<div className="mx-auto flex w-full max-w-screen-xl items-center px-5 md:px-10 lg:px-16">
				<button
					onClick={() => {
						setIsOpen(!isOpen)
					}}
					aria-expanded={isOpen}
					className="flex h-10 items-center justify-start gap-1 px-0 text-sm sm:text-base"
				>
					<div>
						<AlignLeft className="size-4" />
					</div>
					<div className="font-medium">On this page</div>
					<div>
						<ChevronRight
							className={cn(
								'relative size-4 translate-x-0 rotate-0 transition ease-in-out',
								{
									'translate-x-1 rotate-90': isOpen,
								},
							)}
						/>
					</div>
					<p
						className={cn(
							'relative max-w-[300px] truncate overflow-ellipsis text-nowrap opacity-80 transition ease-in-out sm:max-w-full',
							{
								'translate-x-1 opacity-0': isOpen,
							},
						)}
					>
						{activeHeading?.text}
					</p>
				</button>
				{isOpen && (
					<div className="bg-background absolute left-0 top-10 max-h-[50vh] w-full overflow-y-auto border-y pb-5">
						{/* Background line that spans the entire height */}
						<ol className="relative mx-auto w-full max-w-screen-xl px-5 md:px-10 lg:px-16">
							<div className="bg-border absolute left-5 h-full w-px md:left-10 lg:left-16" />
							{data.map((item, index) => {
								const isActive = activeHeading?.slug === item.slug
								return (
									<li key={item.slug} className="relative flex flex-col">
										<div className="relative flex items-center pl-4">
											{isActive && (
												<motion.div
													className="bg-primary absolute left-0 h-6 w-px"
													layoutId="active-heading"
													transition={{
														type: 'spring',
														stiffness: 500,
														damping: 30,
													}}
												/>
											)}
											<Link
												href={`#${item.slug}`}
												className={cn(
													'hover:text-primary text-foreground block py-2 text-sm font-medium leading-4 transition-colors',
													{
														'text-primary': isActive,
													},
												)}
											>
												{item.text}
											</Link>
										</div>
										{/* {JSON.stringify(item.items)} */}
										{item.items.length > 0 && (
											<ol className="">
												{item.items.map((item) => {
													const isActive = activeHeading?.slug === item.slug
													return (
														<li key={item.slug} className="pl-4">
															{isActive && (
																<motion.div
																	className="bg-primary absolute left-0 h-6 w-px"
																	layoutId="active-heading"
																	transition={{
																		type: 'spring',
																		stiffness: 500,
																		damping: 30,
																	}}
																/>
															)}
															<Link
																href={`#${item.slug}`}
																className={cn(
																	'hover:text-primary text-muted-foreground block py-2 pl-4 text-sm leading-4 transition-colors',
																	{
																		'text-primary': isActive,
																	},
																)}
															>
																{item.text}
															</Link>
														</li>
													)
												})}
											</ol>
										)}
									</li>
								)
							})}
						</ol>
					</div>
				)}
			</div>
		</nav>
	)
}
