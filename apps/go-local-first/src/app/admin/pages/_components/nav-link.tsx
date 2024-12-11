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
				'ease-in-ou flex items-center gap-3 border-l-2 px-5 py-5 text-sm font-medium transition duration-300',
				{
					'[&_svg]:text-primary text-foreground border-primary': isActive,
					'hover:text-foreground text-muted-foreground border-transparent':
						!isActive,
				},
			)}
			prefetch={false}
		>
			{children}
		</Link>
	)
}
