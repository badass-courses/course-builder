import * as React from 'react'
import Link from 'next/link'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'

import { cn } from '@coursebuilder/ui/utils/cn'

/**
 * Badge configuration for resource type indicator.
 */
export type ResourceBadge = {
	/** Badge label text */
	label: string
	/** Optional link href */
	href?: string
}

export type ResourceHeaderProps = {
	/** Resource type badge (e.g., "Workshop", "Cohort", "Free Tutorial") */
	badge?: ResourceBadge
	/** Main title */
	title: string
	/** Optional description/subtitle */
	description?: string
	/** Cover image configuration */
	image?: {
		url: string
		alt: string
		/** Image dimensions - defaults to 383x204 for mobile */
		width?: number
		height?: number
	}
	/** Contributor display configuration */
	contributor?: {
		/** Show extended bio */
		withBio?: boolean
		/** Label above contributor (e.g., "Hosted by", "Created by") */
		label?: string
	}
	/** Admin action buttons - rendered in top right */
	adminActions?: React.ReactNode
	/** Additional CSS classes */
	className?: string
	/** Additional content after the header */
	children?: React.ReactNode
}

/**
 * Unified header component for resource landing pages.
 *
 * Provides consistent layout for:
 * - Resource type badge
 * - Title and description
 * - Cover image (responsive)
 * - Contributor attribution
 * - Admin action buttons
 */
export function ResourceHeader({
	badge,
	title,
	description,
	image,
	contributor,
	adminActions,
	className,
	children,
}: ResourceHeaderProps) {
	return (
		<header
			className={cn(
				'flex w-full flex-col items-center justify-between p-5 md:gap-10 lg:flex-row lg:p-8',
				className,
			)}
		>
			{/* Mobile image - only visible on smaller screens */}
			{image && (
				<CldImage
					className="flex w-full lg:hidden"
					width={image.width ?? 383}
					height={image.height ?? 204}
					src={image.url}
					alt={image.alt}
				/>
			)}

			<div className="flex w-full flex-col items-center text-center md:items-start md:text-left">
				{/* Badge */}
				{badge && (
					<div className="pb-5">
						{badge.href ? (
							<Link
								href={badge.href}
								className="bg-primary/20 text-primary inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-semibold"
							>
								<span>{badge.label}</span>
							</Link>
						) : (
							<p className="text-muted-foreground block text-sm font-medium">
								{badge.label}
							</p>
						)}
					</div>
				)}

				{/* Title */}
				<h1 className="text-balance text-3xl font-semibold sm:text-4xl lg:text-5xl">
					{title}
				</h1>

				{/* Description */}
				{description && (
					<h2 className="text-muted-foreground mt-5 text-balance text-lg sm:text-xl">
						{description}
					</h2>
				)}

				{/* Contributor */}
				{contributor && (
					<div className="mt-8 flex flex-col gap-2">
						{contributor.label && (
							<span className="text-muted-foreground text-sm uppercase">
								{contributor.label}
							</span>
						)}
						<div className="border-border rounded-lg border px-5 pl-2">
							<Contributor
								imageSize={66}
								className="[&_div]:text-left"
								withBio={contributor.withBio}
							/>
						</div>
					</div>
				)}

				{children}
			</div>

			{/* Admin actions - positioned absolutely in parent */}
			{adminActions && (
				<React.Suspense fallback={null}>
					<div className="absolute right-0 top-5 z-10">{adminActions}</div>
				</React.Suspense>
			)}
		</header>
	)
}
