import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { z } from 'zod'

const NavLinkItemSchema = z.object({
	href: z.string(),
	label: z.string(),
	onClick: z.function().optional(),
})

export type NavLinkItem = z.infer<typeof NavLinkItemSchema>

export const NavLinkItem: React.FC<NavLinkItem> = ({
	href,
	label,
	onClick,
}) => {
	const LinkOrButton = href ? Link : 'button'
	const pathname = usePathname()
	const isActive = pathname === href.replace(/\/$/, '')
	return (
		<li className="flex items-stretch">
			<LinkOrButton
				href={href}
				className={cn(
					'hover:bg-border/50 flex h-full items-center px-4 text-sm opacity-90 transition hover:opacity-100',
					{
						underline: isActive,
					},
				)}
				onClick={() => {
					track('nav-link-clicked', { label, href })
					onClick && onClick()
				}}
			>
				{label}
			</LinkOrButton>
		</li>
	)
}
