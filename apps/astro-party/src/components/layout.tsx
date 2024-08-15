'use client'

import { useParams, usePathname } from 'next/navigation'

import { cn } from '@coursebuilder/ui/utils/cn'

export const Layout = ({
	children,
	withBackground = true,
	withBorder = true,
	withPadding = true,
	className,
	...props
}: {
	children?: React.ReactNode
	className?: string
	withBackground?: boolean
	withBorder?: boolean
	withPadding?: boolean
}) => {
	const pathname = usePathname()
	const params = useParams()
	const isLessonRoute = params.lesson && params.module
	const isEditRoute = pathname.includes('/edit')

	return (
		<main
			className={cn('container', {
				'px-2 sm:px-5': withPadding,
			})}
			{...props}
		>
			<div
				className={cn(
					'min-h-[calc(100vh)] w-full pt-[var(--nav-height)]',
					{
						'border-x-2': withBorder,
						'bg-background': withBackground,
					},
					className,
				)}
			>
				{children}
			</div>
		</main>
	)
}
