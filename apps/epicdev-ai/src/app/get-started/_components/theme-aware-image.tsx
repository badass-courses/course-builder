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
	const { resolvedTheme } = useTheme()
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
						src ??
						(resolvedTheme === 'light' ? (light ?? dark) : (dark ?? light))!
					}
					fill
					alt={alt}
					aria-hidden={!alt}
				/>
			) : null}
		</div>
	)
}
