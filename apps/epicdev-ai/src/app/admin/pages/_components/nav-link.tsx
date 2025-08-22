'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'

export const NavItem = ({
	href,
	children,
}: {
	href: string
	children: React.ReactNode
}) => {
	const pathname = usePathname()
	const isActive = pathname === href

	return (
		<Link
			href={href}
			className={cn(
				'text-muted-foreground hover:text-foreground hover:bg-card-muted font-heading flex items-center gap-3 px-5 py-3 text-sm font-semibold transition duration-300 ease-out',
				{
					'[&_svg]:text-primary text-foreground bg-foreground/5': isActive,
				},
			)}
			prefetch={false}
		>
			{children}
		</Link>
	)
}
