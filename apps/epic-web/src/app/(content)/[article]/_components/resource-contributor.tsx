import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@coursebuilder/ui/utils/cn'

const ResourceContributor = ({
	name = 'Kent C. Dodds',
	slug = 'kent-c-dodds',
	image = require('../../../../../public/kent-c-dodds.png'),
	byline,
	className,
	disableLink = false,
}: {
	name?: string | null
	slug?: string | null
	image?: string | null
	byline?: string | null
	className?: string
	as?: React.Component
	disableLink?: boolean
}) => {
	if (disableLink) {
		return (
			<div
				className={cn(
					'flex items-center justify-start gap-3 font-semibold text-gray-700  dark:text-gray-100',
					className,
				)}
			>
				<div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
					{image && name && (
						<Image
							priority
							src={image}
							alt={name}
							width={56}
							height={56}
							quality={100}
						/>
					)}
				</div>
				<div className="flex flex-col">
					{byline && <span>{byline}</span>}
					{name}
				</div>
			</div>
		)
	}

	return (
		<Link
			href={`/contributors/${slug}`}
			className={cn(
				'flex items-center justify-start gap-3 font-semibold text-gray-700  dark:text-gray-100',
				className,
			)}
		>
			<div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
				{image && name && (
					<Image
						priority
						src={image}
						alt={name}
						width={56}
						height={56}
						quality={100}
					/>
				)}
			</div>
			<div className="flex flex-col">
				{byline && <span>{byline}</span>}
				{name}
			</div>
		</Link>
	)
}

export default ResourceContributor
