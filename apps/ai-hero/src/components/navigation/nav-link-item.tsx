import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { z } from 'zod'

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

	const content = (
		<>
			{label}

			<div
				className={cn(
					'absolute -bottom-px left-0 flex h-px w-full items-center justify-between bg-[#624F43] transition duration-300 ease-in-out group-hover:opacity-100',
					{
						'opacity-0': !isActive,
					},
				)}
			>
				<svg
					width="5"
					height="5"
					viewBox="0 0 5 5"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="mr-px"
				>
					<path
						d="M0 0L0.828428 0.828428C1.57857 1.57857 2.59599 2 3.65685 2H5V3H3.65685C2.59599 3 1.57857 3.42143 0.828427 4.17157L0 5V0Z"
						fill="#624F43"
					/>
				</svg>
				<svg
					width="5"
					height="5"
					viewBox="0 0 5 5"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="relative ml-px rotate-180"
				>
					<path
						d="M0 0L0.828428 0.828428C1.57857 1.57857 2.59599 2 3.65685 2H5V3H3.65685C2.59599 3 1.57857 3.42143 0.828427 4.17157L0 5V0Z"
						fill="#624F43"
					/>
				</svg>
			</div>
		</>
	)

	return (
		<li className="flex items-stretch">
			{href ? (
				<Link
					href={href}
					onClick={handleClick}
					className={cn(
						'text-foreground-muted relative flex h-full items-center px-4 text-sm transition',
						{
							'brightness-125': isActive,
						},
						className,
					)}
				>
					{content}
				</Link>
			) : (
				<button
					onClick={handleClick}
					className={cn(
						'text-foreground-muted relative flex h-full items-center px-4 text-sm transition',
						{
							'brightness-125': isActive,
						},
						className,
					)}
				>
					{content}
				</button>
			)}
		</li>
	)
}
