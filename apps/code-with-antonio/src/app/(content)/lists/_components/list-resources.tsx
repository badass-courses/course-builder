'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CldImage } from '@/components/cld-image'
import type { List } from '@/lib/lists'
import { cn } from '@/utils/cn'
import { useInView } from 'framer-motion'
import { Check } from 'lucide-react'
import { useMeasure } from 'react-use'

import { Button } from '@coursebuilder/ui'

import { useProgress } from '../../[post]/_components/progress-provider'

export default function ListResources({
	list,
	sticky = true,
}: {
	list: List
	sticky?: boolean
}) {
	const { progress } = useProgress()
	const firstResource = list.resources?.[0]?.resource
	const firstResourceHref = `/${firstResource?.fields?.slug}`
	const router = useRouter()
	const [sidebarRef, { height }] = useMeasure<HTMLDivElement>()
	const [windowHeight, setWindowHeight] = React.useState(0)
	const listSectionRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(listSectionRef, { margin: '0px 0px 0% 0px' })

	React.useEffect(() => {
		if (firstResourceHref) {
			router.prefetch(firstResourceHref)
		}
	}, [firstResourceHref, router])

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
				ref={listSectionRef}
				id="list-nav"
				className="relative col-span-4 flex w-full flex-col"
			>
				<div
					ref={sidebarRef}
					className={cn(
						'bg-card border-border overflow-hidden rounded-lg border shadow-sm',
						{
							'md:sticky md:top-5': sticky && windowHeight - 63 > height,
						},
					)}
				>
					{list.fields?.image && (
						<CldImage
							className="hidden lg:flex"
							width={798}
							height={448}
							src={list.fields.image}
							alt={list.fields.title}
						/>
					)}
					{list.resources.length > 0 && (
						<>
							<div className="flex h-12 items-center border-b px-2.5 py-3 text-lg font-semibold">
								Lessons
							</div>
							<ol className="divide-border flex flex-col divide-y">
								{list.resources.map(({ resource }, i) => {
									const isComplete = progress?.completedLessons.find(
										({ resourceId }) => resourceId === resource.id,
									)
									return (
										<li key={resource.id}>
											<Link
												prefetch
												className="hover:bg-muted flex items-center gap-2 px-4 py-3 transition ease-out"
												href={`/${resource.fields.slug}`}
											>
												{isComplete ? (
													<Check className="text-muted-foreground w-4 shrink-0" />
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
						</>
					)}
				</div>
			</div>

			<ListResourcesMobile
				className={cn({
					'pointer-events-none opacity-0': isInView,
				})}
				list={list}
				firstResourceHref={firstResourceHref}
			/>
		</>
	)
}

const ListResourcesMobile = ({
	list,
	className,
	firstResourceHref,
}: {
	list: List
	className?: string
	firstResourceHref?: string
}) => {
	const handleScrollToList = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault()
		const listSection = document.getElementById('list-nav')
		listSection?.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	}

	return (
		<div
			className={cn(
				'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between border-t px-5 py-4 transition-opacity duration-300 md:hidden',
				className,
			)}
		>
			<p className="font-semibold">{list.fields.title}</p>
			{firstResourceHref ? (
				<Button asChild size="sm">
					<Link href={firstResourceHref}>Start</Link>
				</Button>
			) : (
				<Link
					href="#list-nav"
					onClick={handleScrollToList}
					className="text-primary hover:underline"
				>
					View list
				</Link>
			)}
		</div>
	)
}
