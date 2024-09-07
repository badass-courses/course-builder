'use client'

import { useParams, usePathname } from 'next/navigation'

import { cn } from '@coursebuilder/ui/utils/cn'

export const Layout = ({
	children,
	layoutOptions = {},
	className,
	...props
}: {
	children?: React.ReactNode
	className?: string
	layoutOptions?: any
}) => {
	const pathname = usePathname()
	const params = useParams()
	const isLessonRoute = params.lesson && params.module
	const isEditRoute = pathname.includes('/edit')

	layoutOptions = {
		...layoutOptions,
		withBackground: false,
		withBorder: false,
		withPadding: true,
	}

	return (
		<main
			className={cn('container', {
				'px-2 sm:px-5': layoutOptions.withPadding,
			})}
			{...props}
		>
			<div
				className={cn(
					'min-h-[calc(100vh)] w-full pt-[var(--nav-height)]',
					className,
				)}
			>
				{children}
			</div>
		</main>
	)
}
