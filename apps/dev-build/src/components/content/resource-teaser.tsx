import Image from 'next/image'
import Link from 'next/link'
import { PlayIcon } from '@heroicons/react/24/solid'
import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronRight } from 'lucide-react'

import { Badge, Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { CldImage } from '../cld-image'
import { Contributor } from '../contributor'

const resourceTeaserVariants = cva('', {
	variants: {
		variant: {
			horizontal:
				'flex w-full lg:flex-row flex-col items-center gap-6 lg:gap-16',
			card: 'group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md',
		},
	},
	defaultVariants: {
		variant: 'horizontal',
	},
})

const thumbnailVariants = cva('relative overflow-hidden bg-zinc-900', {
	variants: {
		variant: {
			horizontal:
				'aspect-video w-full max-w-[568px] shrink-0 rounded-xl lg:w-[568px]',
			card: 'aspect-video [&_*]:transition-transform [&>*]:ease-in-out [&>*]:duration-300  group-hover:[&>*]:scale-102 w-full bg-border flex items-center justify-center transition-transform duration-300',
		},
	},
	defaultVariants: {
		variant: 'horizontal',
	},
})

const contentVariants = cva('flex flex-col gap-5', {
	variants: {
		variant: {
			horizontal: 'items-start gap-6',
			card: 'flex-1 p-4',
		},
	},
	defaultVariants: {
		variant: 'horizontal',
	},
})

const titleVariants = cva('', {
	variants: {
		variant: {
			horizontal:
				'sm:text-3xl text-2xl font-medium leading-tight text-foreground',
			card: 'text-lg font-semibold leading-7 leading-tight tracking-tight text-foreground', // line-clamp-2
		},
	},
	defaultVariants: {
		variant: 'horizontal',
	},
})

/**
 * ResourceTeaser displays a promotional card for courses or workshops
 * with a thumbnail, title, description, and CTA button.
 *
 * Supports two variants:
 * - "horizontal": Large promotional card with side-by-side layout
 * - "card": Compact vertical card with thumbnail on top
 */
export interface ResourceTeaserProps
	extends VariantProps<typeof resourceTeaserVariants> {
	/** Course or workshop label (e.g., "New Cohort-based Course") */
	label?: string
	/** Main title of the resource */
	title: string
	/** Title slot for the resource */
	titleSlot?: React.ReactNode
	/** Descriptive text about the resource */
	description?: string
	/** URL to navigate to when clicked */
	href: string
	/** Image URL for the thumbnail */
	thumbnailUrl?: string
	/** Badge text (e.g., "9 days left to enroll") */
	badgeText?: string
	/** Date text (e.g., "Starts Oct 8") */
	dateText?: string
	/** Metadata text (e.g., "35 chapters") - for card variant */
	metadata?: string
	/** CTA button text */
	ctaText?: string
	/** Optional thumbnail badge (e.g., "NEW") */
	thumbnailBadge?: string
	/** Technology/feature tags (e.g., ["React", "Next.js", "Node.js"]) */
	tags?: string[]
	/** Optional className for styling overrides */
	className?: string
}

/**
 * ResourceTeaser component for displaying featured courses and workshops
 */
const ResourceTeaser = ({
	variant = 'horizontal',
	label,
	title,
	titleSlot,
	description,
	href,
	thumbnailUrl,
	badgeText,
	dateText,
	metadata,
	ctaText = 'View course',
	thumbnailBadge,
	tags,
	className,
}: ResourceTeaserProps) => {
	const isCard = variant === 'card'
	const hasVideo = thumbnailUrl?.includes('mux.com')
	return (
		<>
			{isCard ? (
				<Link
					href={href}
					className={cn(resourceTeaserVariants({ variant }), className)}
				>
					{/* Thumbnail */}
					{thumbnailUrl ? (
						<div className={thumbnailVariants({ variant })}>
							<Image
								loading="lazy"
								src={thumbnailUrl}
								alt={title}
								fill
								className="object-cover transition-transform duration-300"
							/>
							{thumbnailBadge && (
								<div className="bg-secondary text-secondary-foreground absolute right-3 top-3 rounded-xl px-4 py-1.5 text-sm">
									{thumbnailBadge}
								</div>
							)}
							{hasVideo && (
								<div className="bg-foreground text-background absolute rounded-full p-2">
									<PlayIcon className="relative size-5 translate-x-0.5" />
								</div>
							)}
						</div>
					) : (
						<div
							className={cn(thumbnailVariants({ variant }), 'overflow-hidden')}
						>
							<span className="text-foreground whitespace-nowrap text-[100px] font-bold opacity-10">
								{title.slice(0, 2)}...
							</span>
						</div>
					)}

					{/* Content */}
					<div className={contentVariants({ variant })}>
						{/* Header section */}
						<div className="flex min-h-[80px] flex-col gap-2.5">
							<h2 className={titleVariants({ variant })}>
								{titleSlot || title}
							</h2>
							<Contributor className="[&_img]:size-8" />
							{metadata && (
								<p className="text-muted-foreground text-sm capitalize leading-none">
									{metadata}
								</p>
							)}
						</div>

						{/* Tags */}
						{tags && tags.length > 0 && (
							<div className="flex flex-wrap gap-0.5">
								{tags.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										// className="rounded-full border-transparent px-2.5 py-0.5 text-xs font-semibold leading-4"
									>
										{tag}
									</Badge>
								))}
							</div>
						)}
					</div>
				</Link>
			) : (
				<div className={cn(resourceTeaserVariants({ variant }), className)}>
					{/* Thumbnail */}
					<Link
						href={href}
						className={cn(thumbnailVariants({ variant }), 'group')}
					>
						{thumbnailUrl && (
							<CldImage
								src={thumbnailUrl}
								alt={title}
								fill
								className="object-cover"
							/>
						)}
						{!thumbnailUrl && (
							<div className="flex h-full items-center justify-center">
								<div className="text-center">
									<p className="font-heading text-4xl font-bold text-white">
										AI-Powered Applications
									</p>
									<p className="mt-2 text-xl text-white/70">
										with AI SDK and Next.js
									</p>
								</div>
							</div>
						)}
						{thumbnailBadge && (
							<div className="absolute right-7 top-7 rounded-xl bg-zinc-950 px-4 py-1.5">
								<span className="text-sm text-white">{thumbnailBadge}</span>
							</div>
						)}
					</Link>

					{/* Content */}
					<div className={contentVariants({ variant })}>
						{/* Header section */}
						<div className="flex flex-col gap-2">
							{label && (
								<p className="text-muted-foreground text-base leading-none">
									{label}
								</p>
							)}
							<h2 className={titleVariants({ variant })}>{title}</h2>
							<div className="flex items-center gap-3">
								{badgeText && (
									<Badge variant="outline" className="rounded-full">
										<span className="text-muted-foreground text-sm font-medium leading-5">
											{badgeText}
										</span>
									</Badge>
								)}
								{dateText && (
									<p className="text-muted-foreground text-sm leading-none">
										{dateText}
									</p>
								)}
							</div>
						</div>

						{description && (
							<p className="text-foreground max-w-[573px] text-base leading-6">
								{description}
							</p>
						)}

						<Button asChild size="lg">
							<Link href={href}>
								<span>
									<span className="font-bold">Save 45%</span> — {ctaText}
								</span>
								<ChevronRight className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			)}
		</>
	)
}

export { ResourceTeaser }
export default ResourceTeaser
