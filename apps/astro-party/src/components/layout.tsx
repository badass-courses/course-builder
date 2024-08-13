'use client'

import { useParams, usePathname } from 'next/navigation'
import Navigation from '@/components/navigation'

import { cn } from '@coursebuilder/ui/utils/cn'

export const Layout = ({
	children,
	className,
}: {
	children?: React.ReactNode
	className?: string
}) => {
	const pathname = usePathname()
	const params = useParams()
	const isLessonRoute = params.lesson && params.module
	const isEditRoute = pathname.includes('/edit')

	return (
		<main
			className={cn(
				'bg-background container flex min-h-[calc(100vh)] flex-col border-x-2 px-2 pt-[var(--nav-height)] sm:px-5',
				className,
			)}
		>
			{children}
		</main>
	)
}
