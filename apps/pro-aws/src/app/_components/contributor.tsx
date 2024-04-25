'use client'

import Image from 'next/image'
import config from '@/config'

export const Contributor = () => {
	return (
		<div className="flex items-center gap-2">
			<Image
				src={require('../../../public/instructor.png')}
				alt={config.author}
				width={40}
				height={40}
				className="rounded-full"
			/>
			<span className="font-medium text-white">{config.author}</span>
		</div>
	)
}
