'use client'

import React from 'react'
import config from '@/config'
import { cn } from '@/utils/cn'

import { CldImage } from './cld-image'

export const Contributor: React.FC<{ className?: string }> = ({
	className,
}) => {
	return (
		<div className={cn('flex items-center gap-2 font-normal', className)}>
			<ContributorImage />
			<span className="text-foreground">{config.author}</span>
		</div>
	)
}

export const ContributorImage = ({
	contributor,
	className,
}: {
	contributor?: { name: string; lastName: string }
	className?: string
}) => {
	return (
		<CldImage
			src={
				'https://res.cloudinary.com/dg3gyk0gu/image/upload/v1683164538/assets/john.webp'
			}
			alt={config.author}
			width={40}
			height={40}
			priority
			className={cn('bg-muted rounded-full', className)}
		/>
	)
}
