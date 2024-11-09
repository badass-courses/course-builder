'use client'

import React from 'react'
import Image from 'next/image'
import config from '@/config'
import { cn } from '@/utils/cn'

export const Contributor: React.FC<{ className?: string }> = ({
	className,
}) => {
	return (
		<div className={cn('flex items-center gap-2 font-normal', className)}>
			<Image
				src={
					'https://res.cloudinary.com/total-typescript/image/upload/v1728059672/matt-pocock_eyjjli.jpg'
				}
				alt={config.author}
				width={40}
				height={40}
				priority
				className="rounded-full"
			/>
			<span className="text-muted-foreground">{config.author}</span>
		</div>
	)
}
