'use client'

import React from 'react'
import Image from 'next/image'
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
						Antonio is a passionate coder and the creative mind behind
						codewithantonio.com.
					</p>
				)}
			</div>
		</div>
	)
}

export const ContributorImage = ({
	contributor,
	className,
	imageSize = 76,
}: {
	contributor?: { name: string; lastName: string }
	className?: string
	imageSize?: number
}) => {
	return (
		<Image
			src={'/ashley.png'}
			alt={config.author}
			width={imageSize}
			height={imageSize}
			quality={100}
			className={cn('rounded-full border ring-2 ring-black/10', className)}
		/>
	)
	// return (
	// 	<CldImage
	// 		src={
	// 			'https://res.cloudinary.com/dezn0ffbx/image/upload/v1760621497/antonio-thumbs-up_2x_r4upxk.png'
	// 		}
	// 		alt={config.author}
	// 		width={imageSize}
	// 		height={imageSize}
	// 		quality={100}
	// 		className={cn('', className)}
	// 	/>
	// )
}
