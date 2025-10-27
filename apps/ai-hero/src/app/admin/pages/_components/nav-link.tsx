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
				'text-foreground/80 hover:text-foreground hover:bg-card/50 ease-in-ou flex items-center gap-3 px-5 py-5 text-sm font-medium transition duration-300',
				{
					'[&_svg]:text-primary bg-card text-foreground': isActive,
				},
			)}
			prefetch={false}
		>
			{children}
		</Link>
	)
}
