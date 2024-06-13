'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/navigation'

import { cn } from '@coursebuilder/ui/utils/cn'

export const Layout = ({ children }: { children?: React.ReactNode }) => {
	const pathname = usePathname()
	const isEditRoute = pathname.includes('/edit')

	return (
		<main
			className={cn('flex min-h-[calc(100vh-var(--nav-height))] flex-col', {
				'content-container': !isEditRoute,
			})}
		>
			<Navigation />
			{children}
		</main>
	)
}
