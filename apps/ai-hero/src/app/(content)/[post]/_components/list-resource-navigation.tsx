'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import Spinner from '@/components/spinner'
import { Check, ExpandIcon, ListIcon } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { useList } from './list-provider'
import { useProgress } from './progress-provider'

export default function ListResourceNavigation({
	className,
}: {
	className?: string
}) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [isExpanded, setIsExpanded] = React.useState(true)
	const { list, isLoading: isListLoading } = useList()
	const { progress } = useProgress()

	if (isListLoading) {
		return (
			<div
				className={cn(
					'bg-muted/50 scrollbar-thin sticky top-[var(--nav-height)] flex h-[calc(100vh-var(--nav-height))] w-full max-w-[340px] items-start justify-start overflow-y-auto border-r p-5',
					className,
					{ 'w-0': !isExpanded },
				)}
			>
				<div className="flex items-center gap-3">
					<Spinner className="w-5" />
					<span className="font-mono text-xs">loading list..</span>
				</div>
			</div>
		)
	}

	if (!searchParams.has('list')) return null
	if (!list) return null

	return (
		<>
			<aside
				className={cn(
					'bg-muted/50 scrollbar-thin sticky top-[var(--nav-height)] h-[calc(100vh-var(--nav-height))] w-full max-w-[340px] overflow-y-auto border-r',
					className,
					{
						'w-0': !isExpanded,
					},
				)}
				key={list.fields.slug}
				ref={(e: any) => {
					// Auto-scroll logic to keep active item in view
					if (e) {
						const current = e.querySelector('[data-current="true"]')
						if (current) {
							const rect = current.getBoundingClientRect()
							const containerRect = e.getBoundingClientRect()

							// Check if the element is out of view (either above or below the container)
							const isOutOfView =
								rect.top < containerRect.top ||
								rect.bottom > containerRect.bottom

							if (isOutOfView) {
								e.scrollTo({
									top: current.offsetTop - e.clientHeight / 2,
								})
							}
						}
					}
				}}
			>
				{/* List header with title */}
				<div className="bg-muted/50 relative border-b p-5">
					<Link
						className="relative z-10 text-lg font-semibold"
						href={`/${list.fields.slug}`}
					>
						✨ {list.fields.title}
					</Link>
					<div className="absolute inset-0 h-full w-full bg-transparent bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:16px_16px]" />
				</div>

				{/* Resource navigation list */}
				<nav>
					<ol className="divide-border flex flex-col divide-y">
						{list.resources.map(({ resource }, i) => {
							const isActive = pathname.includes(`/${resource.fields.slug}`)
							const isCompleted = progress?.completedLessons.find(
								(r) => r.resourceId === resource.id,
							)

							return (
								<li
									data-current={Boolean(isActive).toString()}
									key={`${list.id}_${resource.id}_${i}`}
								>
									<Link
										className={cn(
											'hover:bg-muted flex items-baseline gap-2 border-l-2 border-transparent py-2 pl-2 pr-4 font-medium transition sm:py-3',
											{
												'bg-muted border-primary': isActive,
												'items-center': isCompleted,
											},
										)}
										href={`/${resource.fields.slug}?list=${list.fields.slug}`}
									>
										{isCompleted ? (
											<Check className="text-primary w-2.5" />
										) : (
											<small className="min-w-[2ch] text-right font-mono text-[9px] font-normal opacity-60">
												{i + 1}
											</small>
										)}
										{resource.fields.title}
									</Link>
								</li>
							)
						})}
					</ol>
				</nav>
			</aside>

			{/* Toggle button for expanding/collapsing the navigation */}
			<Button
				variant="outline"
				size="icon"
				className={cn('fixed bottom-5 left-5 z-50')}
				onClick={() => setIsExpanded(!isExpanded)}
			>
				{isExpanded ? (
					<ListIcon className="w-5" />
				) : (
					<ExpandIcon className="w-5" />
				)}
			</Button>
		</>
	)
}
