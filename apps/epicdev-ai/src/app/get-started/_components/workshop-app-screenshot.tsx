'use client'

import React from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTheme } from 'next-themes'

const WorkshopAppScreenshot = () => {
	const { scrollY } = useScroll()
	const welcomeBannerScrollAnimation = useTransform(
		scrollY,
		// Map y from these values:
		[0, 600],
		// Into these values:
		['0deg', '-3deg'],
	)

	const { theme } = useTheme()
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<motion.div
			style={{
				transformOrigin: 'top center',
				transformPerspective: 300,
				rotateX: welcomeBannerScrollAnimation,
			}}
			className="aspect-[1520/1090] h-full w-full"
		>
			{mounted ? (
				<Image
					src={
						theme === 'light'
							? 'https://res.cloudinary.com/epic-web/image/upload/v1696929540/workshop-app-screenshot-light-1_2x.png'
							: 'https://res.cloudinary.com/epic-web/image/upload/v1696929542/workshop-app-screenshot-1_2x.png'
					}
					width={1520}
					quality={100}
					height={1090}
					alt=""
					aria-hidden
					priority
				/>
			) : null}
		</motion.div>
	)
}
export default WorkshopAppScreenshot
