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
		<li>
			<LinkOrButton
				href={href}
				className={cn('px-1 text-sm opacity-90 transition hover:opacity-100', {
					underline: isActive,
				})}
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
