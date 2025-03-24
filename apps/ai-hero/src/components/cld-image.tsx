'use client'

import React, { useEffect, useState } from 'react'
import type { CldImageProps } from 'next-cloudinary'
import { CldImage as CldImage_ } from 'next-cloudinary'
import { useTheme } from 'next-themes'

export const CldImage: React.FC<CldImageProps> = (props) => {
	return <CldImage_ {...props} />
}

export const ThemeImage: React.FC<
	CldImageProps & {
		urls: {
			dark: string
			light: string
		}
	}
> = ({ urls, ...props }) => {
	const { theme } = useTheme()
	const [url, setUrl] = useState(urls.dark)
	useEffect(() => {
		const url = theme === 'dark' ? urls.dark : urls.light
		setUrl(url)
	}, [theme, urls])
	const format = url.endsWith('.svg') ? 'svg' : 'auto'

	return <CldImage_ {...props} src={url} quality={100} format={format} />
}
