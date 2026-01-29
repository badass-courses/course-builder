import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { ChevronRight } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@coursebuilder/ui'

const NavLinkItemSchema = z.object({
	href: z.string().optional(),
	label: z.union([z.string(), z.any()]),
	onClick: z.function().optional(),
	className: z.string().optional(),
	icon: z.any().optional(),
	variant: z.enum(['nav', 'menu']).default('nav').optional(),
	textLabel: z.string().optional(),
})

export type NavLinkItem = z.infer<typeof NavLinkItemSchema>

/**
 * NavLinkItem component that can be used in both navigation and menu contexts
 * @param variant 'nav' for main navigation, 'menu' for dropdown/sheet menus
 */
export const NavLinkItem: React.FC<NavLinkItem> = ({
	href,
	label,
	onClick,
	className,
	icon,
	textLabel,
	variant = 'nav',
}) => {
	const pathname = usePathname()
	const isActive = href && pathname === href.replace(/\/$/, '')

	const handleClick = () => {
		track('nav-link-clicked', {
			label: typeof label === 'string' ? label : textLabel,
			href,
		})
		onClick && onClick()
	}

	const content = (
		<>
			{icon && icon}
			<span className="wrap-break-word whitespace-normal text-balance">
				{label}
			</span>
		</>
	)

	const styles = {
		nav: 'text-foreground hover:bg-muted relative flex h-full items-center px-5 w-full justify-start text-base sm:text-sm transition hover:no-underline sm:px-5',
		menu: 'text-foreground hover:bg-muted flex w-full items-center justify-start text-xl hover:no-underline px-3 sm:text-sm',
	}

	return (
		<li className="flex items-stretch">
			<Button
				className={cn(
					styles[variant],
					{
						'': isActive,
						'bg-muted': isActive && variant === 'menu',
					},
					className,
				)}
				asChild={!onClick}
				variant="link"
				onClick={onClick}
			>
				{onClick ? (
					content
				) : (
					<Link
						prefetch
						href={href!}
						onClick={handleClick}
						className={cn('relative', {
							'underline md:no-underline': isActive,
						})}
					>
						{/* {isActive && (
							<ChevronRight className="text-primary absolute left-0 top-1/2 -translate-y-1/2 md:hidden" />
						)} */}
						{content}
					</Link>
				)}
			</Button>
		</li>
	)
}
