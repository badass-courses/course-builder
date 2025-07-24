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

/**
 * Recursive component to render a table of contents item and its children
 */
function TOCItem({
	item,
	activeHeading,
	depth = 0,
}: {
	item: ReturnType<typeof extractMarkdownHeadings>[number]
	activeHeading: { slug: string; text: string } | null
	depth: number
}) {
	const isActive = activeHeading?.slug === item.slug

	return (
		<li className="relative flex flex-col">
			<div className={cn('relative flex items-center', depth > 0 && 'pl-4')}>
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
						'block py-2 pl-4 text-sm leading-4 transition-colors',
						depth === 0
							? 'text-foreground hover:text-primary font-medium'
							: 'text-muted-foreground hover:text-primary pl-4',
						isActive && 'text-primary',
					)}
				>
					{item.text}
				</Link>
			</div>
			{item.items.length > 0 && (
				<ol className="">
					{item.items.map((child) => (
						<TOCItem
							key={child.slug}
							item={child}
							activeHeading={activeHeading}
							depth={depth + 1}
						/>
					))}
				</ol>
			)}
		</li>
	)
}

export default function PostToC({ markdown }: { markdown: string }) {
	const allHeadings = extractMarkdownHeadings(markdown)
	// Filter out h4 and above headings recursively
	const filterHeadings = (
		headings: ReturnType<typeof extractMarkdownHeadings>,
	): typeof headings => {
		return headings
			.filter((heading) => heading.level < 4)
			.map((heading) => ({
				...heading,
				items: filterHeadings(heading.items),
			}))
	}

	const data = filterHeadings(allHeadings)
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
			className="bg-background/50 border-foreground/5 sticky top-2 z-50 mb-5 flex w-full min-w-[200px] max-w-3xl flex-col rounded-full border px-3 backdrop-blur-lg sm:relative sm:mx-auto sm:border-transparent sm:px-0"
			aria-label="On this page"
		>
			<div className="max-w-(--breakpoint-xl) mx-auto flex w-full items-center">
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
					<div className="flex-shrink-0 font-medium">On this page</div>
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
							'relative max-w-[300px] truncate text-ellipsis text-nowrap opacity-80 transition ease-in-out sm:max-w-full',
							{
								'translate-x-1 opacity-0': isOpen,
							},
						)}
					>
						{activeHeading?.text}
					</p>
				</button>
				{isOpen && (
					<div className="bg-card absolute left-0 top-10 max-h-[50vh] w-full overflow-y-auto rounded-md border py-3 shadow-sm">
						<ol className="max-w-(--breakpoint-xl) relative mx-auto w-full">
							{/* <div className="bg-border absolute left-0 h-full w-px" /> */}
							{data.map((item) => (
								<TOCItem
									key={item.slug}
									item={item}
									activeHeading={activeHeading}
									depth={0}
								/>
							))}
						</ol>
					</div>
				)}
			</div>
		</nav>
	)
}
