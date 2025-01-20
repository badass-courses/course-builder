'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import Spinner from '@/components/spinner'
import { Check, MenuIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'

import {
	Button,
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { useList } from './list-provider'
import { useProgress } from './progress-provider'

export default function ListResourceNavigation({
	className,
	withHeader = true,
}: {
	className?: string
	withHeader?: boolean
}) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [isExpanded, setIsExpanded] = React.useState(true)
	const { list, isLoading: isListLoading } = useList()
	const { progress } = useProgress()
	const { data: session } = useSession()

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
					'bg-muted/50 scrollbar-thin sticky top-[var(--nav-height)] hidden h-[calc(100vh-var(--nav-height))] w-full max-w-[340px] overflow-y-auto border-r xl:block',
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
				{withHeader && (
					<div className="bg-muted/50 relative border-b p-5">
						<Link
							className="relative z-10 text-lg font-semibold"
							href={`/${list.fields.slug}`}
						>
							✨ {list.fields.title}
						</Link>
						<div className="absolute inset-0 h-full w-full bg-transparent bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:16px_16px]" />
					</div>
				)}
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
										aria-current={isActive ? 'page' : undefined}
										className={cn(
											'hover:bg-muted flex items-baseline gap-2 py-2 pl-2 pr-4 font-medium transition sm:py-3',
											{
												'text-primary-foreground bg-primary hover:bg-primary/80':
													isActive,
												'items-center': isCompleted,
											},
										)}
										href={`/${resource.fields.slug}?list=${list.fields.slug}`}
									>
										<div className="min-w-[2ch] text-right font-mono text-[9px] font-normal">
											{isCompleted ? (
												<Check
													className={cn('text-primary w-[2ch]', {
														'text-primary-foreground': isActive,
													})}
												/>
											) : (
												<small className="opacity-60">{i + 1}</small>
											)}
										</div>
										{resource.fields.title}
									</Link>
								</li>
							)
						})}
					</ol>
				</nav>
			</aside>
		</>
	)
}

export function MobileListResourceNavigation() {
	const { list } = useList()
	const [isOpen, setIsOpen] = React.useState(false)
	if (!list) return null
	return (
		<>
			{/* {!isOpen && ( */}
			<div className="bg-card fixed left-0 top-2 z-50 flex scale-90 items-center gap-4 rounded-full border py-1 pl-1 pr-6 shadow-xl xl:hidden">
				<Button
					className="rounded-full"
					onClick={() => {
						setIsOpen((prev) => !prev)
					}}
					variant="default"
					size="icon"
				>
					<MenuIcon className="w-4" />
				</Button>
				<Link href={`/${list?.fields?.slug}`} className="text-base font-medium">
					{list?.fields?.title}
				</Link>
			</div>
			{/* )} */}
			<Sheet onOpenChange={setIsOpen} open={isOpen}>
				<SheetContent className="p-0 pb-10 pt-3">
					<SheetTitle className="px-5">{list?.fields?.title}</SheetTitle>
					<ListResourceNavigation
						withHeader={false}
						className="relative top-0 block h-full w-full max-w-full border-r-0 bg-transparent xl:hidden"
					/>
					{/* 'bg-muted/50 scrollbar-thin sticky top-[var(--nav-height)] hidden h-[calc(100vh-var(--nav-height))] w-full max-w-[340px] overflow-y-auto border-r xl:block', */}
				</SheetContent>
			</Sheet>
		</>
	)
}
