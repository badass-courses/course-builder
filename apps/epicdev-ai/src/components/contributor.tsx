'use client'

import React from 'react'
import Image from 'next/image'
import config from '@/config'
import { cn } from '@/utils/cn'

import { CldImage } from './cld-image'

export type AuthorInfo = {
	name: string
	image?: string | null
}

export const Contributor: React.FC<{
	className?: string
	withBio?: boolean
	imageSize?: number
	author?: AuthorInfo
}> = ({ className, withBio = false, imageSize = 40, author }) => {
	const authorName = author?.name || config.author

	return (
		<div className={cn('flex items-center gap-2 font-normal', className)}>
			<ContributorImage author={author} imageSize={imageSize} />
			<div className="flex flex-col">
				<span className="text-foreground/90 font-heading text-base font-medium">
					{authorName}
				</span>
				{withBio && (
					<p className="text-foreground/75 text-sm">
						A full-stack educator, open source enthusiast, and the creator of
						EpicAI.pro.
					</p>
				)}
			</div>
		</div>
	)
}

export const ContributorImage = ({
	contributor: _contributor,
	author,
	className,
	imageSize = 40,
}: {
	/** @deprecated Use author instead */
	contributor?: { name: string; lastName: string }
	author?: AuthorInfo
	className?: string
	imageSize?: number
}) => {
	// If author has a custom image, use next/image
	if (author?.image) {
		return (
			<Image
				src={author.image}
				alt={author.name}
				width={imageSize}
				height={imageSize}
				className={cn(
					'bg-muted ring-gray-800/7.5 shrink-0 rounded-full ring-1',
					className,
				)}
			/>
		)
	}

	// If author is provided but has no image, show initials
	if (author && !author.image) {
		const authorInitial = (author.name || 'A')[0]?.toUpperCase() || 'A'
		return (
			<div
				className={cn(
					'bg-muted ring-gray-800/7.5 flex shrink-0 items-center justify-center rounded-full ring-1',
					className,
				)}
				style={{ width: imageSize, height: imageSize }}
			>
				<span className="text-foreground/60 text-sm font-medium">
					{authorInitial}
				</span>
			</div>
		)
	}

	// Default Kent C. Dodds image
	return (
		<CldImage
			src={
				'https://res.cloudinary.com/epic-web/image/upload/v1718221991/epicweb.dev/instructors/kent-c-dodds.png'
			}
			alt={config.author}
			width={imageSize}
			height={imageSize}
			priority
			className={cn(
				'bg-muted ring-gray-800/7.5 shrink-0 rounded-full ring-1',
				className,
			)}
		/>
	)
}
