'use client'

import * as React from 'react'
import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FeedItem } from '@/lib/feed-query'
import { motion } from 'framer-motion'

import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import {
	VideoThumbnailPreview,
	type VideoThumbnailPreviewHandle,
} from '../content/video-thumbnail-preview'
import { Contributor } from '../contributor'

/**
 * Single feed card with hover-to-preview video support.
 * Captures current playback time and passes it via `?t=` param on click.
 */
function FeedCard({ resource }: { resource: FeedItem }) {
	const router = useRouter()
	const videoPreviewRef = React.useRef<VideoThumbnailPreviewHandle>(null)
	const [isHovering, setIsHovering] = React.useState(false)

	const title = resource.fields?.title
	const slug = resource.fields?.slug
	const type = resource.type
	const videoResource = resource.resources?.find(
		(r) => r.resource.type === 'videoResource',
	)
	const muxPlaybackId = videoResource?.resource.fields?.muxPlaybackId
	const thumbnailTime = videoResource?.resource.fields?.thumbnailTime || 0
	const thumbnailUrl = muxPlaybackId
		? `https://image.mux.com/${muxPlaybackId}/thumbnail.png?time=${thumbnailTime}&width=880`
		: resource.fields?.coverImage?.url || null
	const hasVideo = Boolean(muxPlaybackId)

	const navigateToPost = (currentTime?: number) => {
		const basePath = getResourcePath(type, slug, 'view')
		const timeParam = currentTime ? Math.floor(currentTime) : 0

		if (timeParam > 0) {
			router.push(`${basePath}?t=${timeParam}`)
		} else {
			router.push(basePath)
		}
	}

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault()
		const currentTime = videoPreviewRef.current?.getCurrentTime()
		navigateToPost(currentTime)
	}

	const handleVideoPause = (currentTime: number) => {
		navigateToPost(currentTime)
	}

	return (
		<motion.li
			className="bg-background hover:bg-border group"
			whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
			initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
			exit={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
			transition={{ duration: 0.5 }}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			<motion.div
				className="bg-background hover:bg-card relative flex h-full flex-col"
				// whileHover={{ scale: 0.97 }}
				// transition={{ type: 'spring', stiffness: 400, damping: 25 }}
			>
				{/* Thumbnail - outside the link so video controls work */}
				{thumbnailUrl ? (
					<div
						className="bg-muted text-muted-foreground relative flex aspect-video w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden"
						onClick={handleClick}
					>
						{hasVideo && muxPlaybackId ? (
							<VideoThumbnailPreview
								ref={videoPreviewRef}
								thumbnailUrl={thumbnailUrl}
								muxPlaybackId={muxPlaybackId}
								title={title}
								thumbnailTime={thumbnailTime}
								isHovering={isHovering}
								onPause={handleVideoPause}
							/>
						) : (
							<Image
								loading="lazy"
								src={thumbnailUrl}
								alt={title}
								fill
								className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
							/>
						)}
					</div>
				) : (
					<div
						className="bg-muted text-muted-foreground relative flex aspect-video w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden border-b"
						onClick={handleClick}
					>
						<span className="text-foreground whitespace-nowrap text-[100px] font-bold opacity-10 transition-transform duration-300 group-hover:scale-105">
							{title.slice(0, 2)}...
						</span>
					</div>
				)}

				{/* Content - wrapped in link for navigation */}
				<Link
					href={getResourcePath(type, slug, 'view')}
					onClick={handleClick}
					className="flex h-full flex-col gap-2.5"
				>
					<div className="flex h-full min-h-[170px] flex-col justify-between gap-2.5 px-5 pb-5 pt-4">
						<h2 className="line-clamp-3 font-sans text-xl font-semibold tracking-tight">
							{title}
						</h2>
						<Contributor className="text-muted-foreground text-sm [&_img]:size-8" />
					</div>
				</Link>
			</motion.div>
		</motion.li>
	)
}

export default function HomeFeed({
	feedLoader,
}: {
	feedLoader: Promise<FeedItem[]>
}) {
	const feed = use(feedLoader)

	// Calculate placeholders needed to fill rows at each breakpoint
	const feedLength = feed.length
	const smPlaceholders = (2 - (feedLength % 2)) % 2 // 0 or 1 for 2-col grid
	const lgPlaceholders = (3 - (feedLength % 3)) % 3 // 0, 1, or 2 for 3-col grid

	// Placeholder 1: visible when sm needs 1, or lg needs >= 1
	const placeholder1Classes = cn(
		'hidden bg-background relative w-full overflow-hidden h-full flex items-center justify-center',
		smPlaceholders >= 1 && 'sm:flex',
		lgPlaceholders >= 1 && smPlaceholders === 0 && 'lg:flex',
		lgPlaceholders === 0 && smPlaceholders >= 1 && 'lg:hidden',
	)

	// Placeholder 2: only visible when lg needs 2
	const placeholder2Classes = cn(
		'hidden bg-background relative w-full overflow-hidden h-full flex items-center justify-center',
		lgPlaceholders >= 2 && 'lg:flex',
	)

	return (
		<section>
			<ul className="bg-border grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
				{feed.map((resource) => (
					<FeedCard key={resource.id} resource={resource} />
				))}
				<motion.li
					whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
					initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
					exit={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
					transition={{ duration: 0.5 }}
					className={placeholder1Classes}
				>
					<svg className="absolute inset-0 h-full w-full">
						<line
							x1="0"
							y1="0"
							x2="100%"
							y2="100%"
							stroke="currentColor"
							strokeWidth="1"
							className="text-border"
						/>
					</svg>
				</motion.li>
				<motion.li
					whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
					initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
					exit={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
					transition={{ duration: 0.5 }}
					className={placeholder2Classes}
				>
					<svg className="absolute inset-0 h-full w-full">
						<line
							x1="0"
							y1="0"
							x2="100%"
							y2="100%"
							stroke="currentColor"
							strokeWidth="1"
							className="text-border"
						/>
					</svg>
				</motion.li>
			</ul>
		</section>
	)
}
