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
				'text-foreground/75 hover:[&_svg]:text-primary hover:text-foreground bg-card/20 hover:bg-card/50 ease-in-ou flex items-center gap-3 px-5 py-5 text-sm font-medium transition duration-300 [&_svg]:shrink-0 [&_svg]:opacity-50',
				{
					'[&_svg]:text-primary text-foreground bg-card': isActive,
				},
			)}
			prefetch={false}
		>
			{children}
		</Link>
	)
}
