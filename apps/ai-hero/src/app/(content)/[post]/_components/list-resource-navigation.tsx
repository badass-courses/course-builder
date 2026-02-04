'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import Spinner from '@/components/spinner'
import { AlignLeft, Book, Check } from 'lucide-react'

import { Button, Sheet, SheetContent } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { AutoPlayToggle } from '../../_components/autoplay-toggle'
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
	const [isExpanded, setIsExpanded] = React.useState(true)
	const { list, isLoading: isListLoading, currentPostHasVideo } = useList()
	const { progress } = useProgress()

	if (isListLoading) {
		return (
			<div
				className={cn(
					'bg-muted/50 scrollbar-thin top-(--nav-height) sticky flex h-[calc(100vh-var(--nav-height))] w-full max-w-[320px] shrink-0 items-start justify-start overflow-y-auto border-r p-5',
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

	if (!list) return null

	return (
		<>
			<aside
				className={cn(
					'bg-muted/50 scrollbar-thin top-(--nav-height) sticky hidden h-[calc(100vh-var(--nav-height))] w-full max-w-[320px] shrink-0 overflow-y-auto border-r xl:block',
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
					<div className="bg-muted/50 bg-stripes relative flex flex-col border-b p-5">
						<Link
							className="font-heading relative z-10 inline-flex items-center gap-2 text-xl font-bold hover:underline"
							href={`/${list.fields.slug}`}
						>
							<Book className="text-primary w-4" /> {list.fields.title}
						</Link>
						{currentPostHasVideo && (
							<AutoPlayToggle className="text-muted-foreground hover:text-foreground relative z-10 -ml-1 mt-2 gap-0 text-xs transition [&_button]:scale-75" />
						)}
					</div>
				)}
				{/* Resource navigation list */}
				<nav>
					<ol className="flex flex-col">
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
											'hover:bg-linear-to-l dark:hover:bg-linear-to-l relative flex items-start gap-2 py-2 pl-2 pr-5 font-medium transition duration-150 ease-in-out hover:from-transparent hover:to-gray-200 sm:py-3 dark:hover:bg-gray-900 dark:hover:from-transparent dark:hover:to-gray-800',
											{
												'': isCompleted,
												'before:absolute before:left-[17px] before:top-0 before:h-full before:w-px before:bg-gray-200 before:content-[""] dark:before:bg-gray-800':
													true,
												'before:bg-linear-to-b dark:before:bg-linear-to-b before:from-transparent before:via-gray-500 before:to-transparent dark:before:from-transparent dark:before:via-gray-500 dark:before:to-transparent':
													isActive,
												'opacity-[0.85] hover:opacity-100': !isActive,
												'bg-gray-200 dark:bg-gray-800/75': isActive,
											},
										)}
										href={`/${resource.fields.slug}`}
									>
										<div
											className={cn(
												'bg-background relative z-10 flex h-5 w-5 shrink-0 translate-y-0.5 items-center justify-center rounded-full border border-gray-300 text-center font-mono text-[11px] font-semibold dark:border-gray-700 dark:bg-gray-800',
												{
													'dark:bg-primary bg-foreground text-background border-primary dark:border-primary':
														isActive,
												},
											)}
										>
											{isCompleted ? (
												<Check
													strokeWidth={3}
													className={cn('w-3', {
														'': isActive,
													})}
												/>
											) : (
												<small className="tracking-tighter">{i + 1}</small>
											)}
										</div>
										<span className="">{resource.fields.title}</span>
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
			<div className="bg-card fixed left-1 top-1.5 z-50 flex scale-90 items-center gap-4 rounded-lg border py-1 pl-1 pr-6 shadow-sm sm:left-3 xl:sr-only xl:hidden">
				<Button
					className="rounded"
					onClick={() => {
						setIsOpen((prev) => !prev)
					}}
					variant="default"
					size="icon"
				>
					<AlignLeft className="w-5" />
				</Button>
				<Link href={`/${list?.fields?.slug}`} className="text-base font-medium">
					{list?.fields?.title}
				</Link>
			</div>

			<Sheet onOpenChange={setIsOpen} open={isOpen}>
				<SheetContent side="left" className="overflow-y-auto px-0">
					{/* <SheetTitle className="px-5">{list?.fields?.title}</SheetTitle> */}
					<Link
						href={`/${list?.fields?.slug}`}
						className="inline-flex px-5 pb-5 pt-10 text-lg font-bold"
					>
						{list?.fields?.title}
					</Link>
					<ListResourceNavigation
						withHeader={false}
						className="relative top-0 block h-full w-full max-w-full border-r-0 bg-transparent text-sm xl:hidden"
					/>
					{/* 'bg-muted/50 scrollbar-thin sticky top-(--nav-height) hidden h-[calc(100vh-var(--nav-height))] w-full max-w-[340px] overflow-y-auto border-r xl:block', */}
				</SheetContent>
			</Sheet>
		</>
	)
}
