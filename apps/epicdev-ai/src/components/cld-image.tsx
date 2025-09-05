'use client'

import React, { useEffect, useState } from 'react'
import type { CldImageProps } from 'next-cloudinary'
import { CldImage as CldImage_ } from 'next-cloudinary'
import { useTheme } from 'next-themes'

import { cn } from '@coursebuilder/ui/utils/cn'

export const CldImage: React.FC<CldImageProps> = (props) => {
	return <CldImage_ {...props} />
}

type ThemeImageProps = CldImageProps & {
	urls: {
		dark: string
		light: string
	}
}

export const ThemeImage: React.FC<ThemeImageProps> = ({
	urls,
	width,
	height,
	...props
}) => {
	const { theme, systemTheme, forcedTheme } = useTheme()
	const [url, setUrl] = useState<string | null>(null)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (!mounted) return
		const currentTheme = forcedTheme || theme === 'system' ? systemTheme : theme
		const url = currentTheme === 'dark' ? urls.dark : urls.light
		setUrl(url)
	}, [theme, systemTheme, urls, mounted, forcedTheme])

	if (!mounted || !url) {
		return (
			<Shimmer
				className={cn('', props.className)}
				style={{
					aspectRatio: `${width} / ${height}`,
					maxWidth: width,
					maxHeight: height,
					width: '100%',
					height: 'auto',
					marginTop: 32,
					marginBottom: 32,
				}}
			/>
		)
	}

	const format = url.endsWith('.svg') ? 'svg' : 'auto'
	return (
		<CldImage_
			{...props}
			className={cn('', props.className)}
			width={width}
			height={height}
			src={url}
			quality={100}
			format={format}
		/>
	)
}

const Shimmer: React.FC<{
	className?: string
	style?: React.CSSProperties
}> = ({ className, style }) => {
	return (
		<div
			className={cn(
				'bg-linear-to-r bg-size-[200%_100%] my-8 animate-pulse rounded-xl from-gray-100 via-gray-200 to-gray-100 sm:my-10 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
				className,
			)}
			style={style}
		/>
	)
}
