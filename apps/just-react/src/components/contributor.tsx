'use client'

import React from 'react'
import Image from 'next/image'
import config from '@/config'
import { cn } from '@/utils/cn'

import danAbramovImage from '../../public/dan-abramov.jpg'
import { CldImage } from './cld-image'

export const Contributor: React.FC<{
	className?: string
	withBio?: boolean
	imageSize?: number
}> = ({ className, withBio = false, imageSize = 40 }) => {
	return (
		<div
			className={cn(
				'flex items-center gap-2 font-serif font-normal',
				className,
			)}
		>
			<ContributorImage imageSize={imageSize} />
			<div className="flex flex-col">
				<span className="text-foreground/90">{config.author}</span>
				{withBio && (
					<p className="text-foreground/75 text-sm">
						Created Redux, worked on React team at Meta, known for deep-dive
						technical writing.
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
		<Image
			src={danAbramovImage}
			className={cn('rounded-full', className)}
			alt={config.author}
			width={imageSize}
			height={imageSize}
		/>
	)
}
