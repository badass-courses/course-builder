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
				src={'/nik-graf.jpeg'}
				alt={config.author}
				width={40}
				height={40}
				priority
				className="rounded-full"
			/>
			<span className="opacity-90">{config.author}</span>
		</div>
	)
}
