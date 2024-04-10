import * as React from 'react'
import Link from 'next/link'
import { track } from '@/utils/analytics'
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

	return (
		<li>
			<LinkOrButton
				href={href}
				className="text-sm opacity-90 transition hover:opacity-100"
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
