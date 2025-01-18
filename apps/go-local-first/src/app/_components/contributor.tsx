'use client'

import React from 'react'
import Image from 'next/image'
import config from '@/config'
import type { PostCreator } from '@/lib/posts'
import { cn } from '@/utils/cn'

import { Gravatar } from '@coursebuilder/ui'

export const Contributor: React.FC<{
	contributor?: PostCreator
	className?: string
}> = ({ className, contributor }) => {
	return contributor ? (
		<div className={cn('flex items-center gap-2 font-normal', className)}>
			<Gravatar email={contributor.email} className="h-8 w-8 rounded-full" />
			<span className="opacity-90">{contributor.name}</span>
		</div>
	) : (
		<div className={cn('flex items-center gap-2 font-normal', className)}>
			<Image
				src={'/nik-graf.jpeg'}
				alt={config.author}
				width={32}
				height={32}
				priority
				className="rounded-full"
			/>
			<span className="opacity-90">{config.author}</span>
		</div>
	)
}
