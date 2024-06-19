'use client'

import * as React from 'react'
import { Links } from '@/components/app/navigation/links'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

type NavigationProps = {
	className?: string
	navigationContainerClassName?: string
}

const Navigation: React.FC<NavigationProps> = ({
	className,
	navigationContainerClassName,
}) => {
	return (
		<>
			<motion.div
				className={cn(
					`border-foreground/5 dark:bg-background/90 fixed left-0 top-0 z-50 flex w-full flex-col items-center justify-center border-b bg-white/95 shadow shadow-gray-300/20 backdrop-blur-md transition dark:shadow-xl dark:shadow-black/20 print:hidden`,
					navigationContainerClassName,
				)}
			>
				<nav
					aria-label="top"
					className={cn(
						'relative mx-auto flex h-12 w-full max-w-screen-lg items-center justify-between px-3 text-sm',
						className,
					)}
				>
					<Links />
				</nav>
			</motion.div>
		</>
	)
}

export default Navigation
