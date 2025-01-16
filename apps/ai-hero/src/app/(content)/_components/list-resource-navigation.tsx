'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { List } from '@/lib/lists'
import { ExpandIcon, ListIcon, type ChevronRight } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export default function ListResourceNavigation({
	listLoader,
}: {
	listLoader: Promise<List | null>
}) {
	const list = use(listLoader)
	const pathname = usePathname()
	const [isExpanded, setIsExpanded] = React.useState(true)

	if (!list) return null

	return (
		<>
			<aside
				className={cn(
					'bg-muted/50 scrollbar-thin sticky top-[var(--nav-height)] h-[calc(100vh-var(--nav-height))] w-full max-w-[340px] overflow-y-auto border-r',
					{
						'w-0': !isExpanded,
					},
				)}
			>
				<div className="border-b p-5">
					<Link className="text-lg font-semibold" href={`/${list.fields.slug}`}>
						✨ {list.fields.title}
					</Link>
				</div>
				<nav>
					<ol className="divide-border flex flex-col divide-y">
						{list.resources.map(({ resource }, i) => {
							const isActive = pathname.includes(`/${resource.fields.slug}`)

							return (
								<li key={resource.id}>
									<Link
										className={cn(
											'hover:bg-muted flex items-baseline gap-2 py-2 pl-2 pr-4 font-medium transition sm:py-3',
											{
												'bg-muted': isActive,
											},
										)}
										href={`/${resource.fields.slug}?list=${list.fields.slug}`}
									>
										<small className="min-w-[2ch] text-right font-mono text-[9px] font-normal opacity-60">
											{i + 1}
										</small>
										{resource.fields.title}
									</Link>
								</li>
							)
						})}
					</ol>
				</nav>
				<Button
					variant="outline"
					size="icon"
					className={cn('absolute bottom-5', {
						'left-5': !isExpanded,
						'right-5': isExpanded,
					})}
					onClick={() => setIsExpanded(!isExpanded)}
				>
					{isExpanded ? (
						<ListIcon className="w-5" />
					) : (
						<ExpandIcon className="w-5" />
					)}
				</Button>
			</aside>
		</>
	)
}
