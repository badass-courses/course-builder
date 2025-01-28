import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { z } from 'zod'

import { Button } from '@coursebuilder/ui'

const NavLinkItemSchema = z.object({
	href: z.string().optional(),
	label: z.union([z.string(), z.any()]),
	onClick: z.function().optional(),
	className: z.string().optional(),
})

export type NavLinkItem = z.infer<typeof NavLinkItemSchema>
export const NavLinkItem: React.FC<NavLinkItem> = ({
	href,
	label,
	onClick,
	className,
}) => {
	const pathname = usePathname()
	const isActive = href && pathname === href.replace(/\/$/, '')

	const handleClick = () => {
		track('nav-link-clicked', { label, href })
		onClick && onClick()
	}

	const content = <>{label}</>

	return (
		<li className="flex items-stretch">
			{href ? (
				<Button
					className={cn(
						' text-foreground hover:bg-muted relative flex h-full items-center px-5 text-sm transition hover:no-underline',
						{
							underline: isActive,
						},
						className,
					)}
					asChild
					variant="link"
				>
					<Link href={href} onClick={handleClick}>
						{content}
					</Link>
				</Button>
			) : (
				<Button
					onClick={handleClick}
					className={cn(
						' text-foreground hover:bg-muted relative flex h-full items-center px-5 text-sm transition hover:no-underline',
						{
							underline: isActive,
						},
						className,
					)}
					variant="link"
				>
					{content}
				</Button>
			)}
		</li>
	)
}
