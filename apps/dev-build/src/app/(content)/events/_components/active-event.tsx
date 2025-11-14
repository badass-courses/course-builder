'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { api } from '@/trpc/react'

import { Badge, Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export function ActiveEventButton({ className }: { className?: string }) {
	const { data: events } = api.events.getActiveEvents.useQuery()
	const firstEvent = events?.[0]
	const pathname = usePathname()
	if (!firstEvent) return null
	if (pathname.includes('/edit')) return null
	if (pathname.includes(firstEvent.fields.slug)) return null

	return (
		<div className={cn('', className)}>
			<Button
				asChild
				className="from-primary font-heading dark:from-primary bg-linear-to-b to-indigo-800 text-white shadow-lg shadow-indigo-800/20 dark:to-indigo-600 dark:text-black"
			>
				<Link href={getResourcePath('event', firstEvent.fields.slug, 'view')}>
					{/* <Marquee className="max-w-24 [--duration:20s]"> */}
					<span className="text-sm font-semibold dark:text-white">
						Get Ticket
					</span>
					{/* </Marquee> */}
				</Link>
			</Button>
		</div>
	)
}

export function ActiveEventBanner({ className }: { className?: string }) {
	const { data: events } = api.events.getActiveEvents.useQuery()
	const event = events?.[0]
	const pathname = usePathname()
	if (!event) return null
	if (pathname.includes('/edit')) return null
	if (pathname.includes(event.fields.slug)) return null
	const video = event?.resources?.find(
		(resource) => resource.resource.type === 'videoResource',
	)
	const muxPlaybackId = video?.resource.fields.muxPlaybackId
	const thumbnailTime = event.fields.thumbnailTime || 0
	const thumbnailUrl =
		muxPlaybackId &&
		`https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?time=${thumbnailTime}&width=1000`

	return (
		<div
			className={cn(
				'flex flex-col overflow-hidden rounded-lg border md:h-64 md:flex-row md:gap-4',
				className,
			)}
		>
			{thumbnailUrl && (
				<div className="relative flex aspect-video h-full w-full md:aspect-auto">
					<Image
						className="object-cover"
						src={thumbnailUrl}
						alt={event.fields.title}
						fill
						quality={100}
					/>
				</div>
			)}
			<div className="flex flex-col items-start justify-center gap-4 p-5">
				<h2 className="text-2xl font-semibold">{event.fields.title}</h2>
				<p className="text-muted-foreground text-sm">
					{event.fields.description}
				</p>
				<Button
					asChild
					className="from-primary bg-linear-to-b to-indigo-800 shadow-lg shadow-indigo-800/20 dark:to-indigo-500 dark:text-black"
				>
					<Link href={getResourcePath('event', event.fields.slug, 'view')}>
						<span className="text-sm font-medium">Get Your Ticket</span>
					</Link>
				</Button>
			</div>
		</div>
	)
}
