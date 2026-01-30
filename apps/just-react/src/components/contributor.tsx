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
	children?: React.ReactNode
}> = ({ className, withBio = false, imageSize = 60, children }) => {
	return (
		<div className={cn('flex items-center text-sm font-semibold', className)}>
			<ContributorImage imageSize={imageSize} />
			<div className="flex flex-col">
				<span className="">{config.author}</span>
				{withBio && (
					<p className="text-foreground/75 text-sm">
						Created Redux, worked on React team at Meta, known for deep-dive
						technical writing.
					</p>
				)}
				{children}
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
				'https://res.cloudinary.com/dbdlunqwz/image/upload/v1769766029/dan-abramov_pleos6.png'
			}
			className={cn('rounded-full', className)}
			alt={config.author}
			width={imageSize}
			height={imageSize}
		/>
	)
}
