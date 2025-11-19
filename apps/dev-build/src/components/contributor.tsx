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
						John Lindquist is a co‑founder of egghead.io and pioneered the
						standard of bite-sized education over the past 13 years.
					</p>
				)}
			</div>
		</div>
	)
}

export const ContributorImage = ({
	contributor,
	className,
	imageSize = 100,
}: {
	contributor?: { name: string; lastName: string }
	className?: string
	imageSize?: number
}) => {
	return (
		<CldImage
			src={
				'https://res.cloudinary.com/johnlindquist/image/upload/c_thumb,g_face,w_350,h_350,z_1.9/f_auto/q_auto/v1745836451/john-lindquist-pro-cursor-ai-avatar_xodtsm'
			}
			alt={config.author}
			width={imageSize}
			height={imageSize}
			quality={100}
			className={cn('rounded-full', className)}
		/>
	)
}
