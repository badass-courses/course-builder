'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

import { cn } from '@coursebuilder/ui/utils/cn'

export function Body({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) {
	const pathname = usePathname()
	const isEditRoute = pathname.includes('/edit')
	const isAdminRoute = pathname.includes('/admin')

	return (
		<body
			className={cn('flex min-h-screen flex-col', className, {
				'bg-brand-green': !isEditRoute || !isAdminRoute,
				'bg-background': isEditRoute || isAdminRoute,
			})}
		>
			{children}
		</body>
	)
}
