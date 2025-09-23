'use client'

import React from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'

export default function ThemeAwareImage({
	src,
	light,
	dark,
	alt = '',
}: {
	src?: string
	light?: string
	dark?: string
	alt?: string
}) {
	const { theme } = useTheme()
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	if (!src && !light && !dark) return null

	return (
		<div className="relative aspect-video">
			{mounted ? (
				<Image
					src={
						typeof src === 'string' ? src : theme === 'light' ? light! : dark!
					}
					fill
					alt={alt}
					aria-hidden={!alt}
				/>
			) : null}
		</div>
	)
}
