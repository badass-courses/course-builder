'use client'

import React from 'react'
import config from '@/config'
import { cn } from '@/utils/cn'

import { CldImage } from './cld-image'

export const Contributor: React.FC<{
	className?: string
	withBio?: boolean
	imageSize?: number
}> = ({ className, withBio = false, imageSize = 40 }) => {
	return (
		<div className={cn('flex items-center gap-2 font-normal', className)}>
			<ContributorImage imageSize={imageSize} />
			<div className="flex flex-col">
				<span className="text-foreground/90 font-heading text-base font-medium">
					{config.author}
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
	contributor,
	className,
	imageSize = 40,
}: {
	contributor?: { name: string; lastName: string }
	className?: string
	imageSize?: number
}) => {
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
