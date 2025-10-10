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
				<span className="text-foreground/90">{config.author}</span>
				{withBio && (
					<p className="text-foreground/75 text-sm">
						A well-regarded expert developer known for his ability to demystify
						complex concepts.
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
				'https://res.cloudinary.com/total-typescript/image/upload/v1728059672/matt-pocock_eyjjli.jpg'
			}
			alt={config.author}
			width={imageSize}
			height={imageSize}
			priority
			className={cn('rounded-full', className)}
		/>
	)
}
