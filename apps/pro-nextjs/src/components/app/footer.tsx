'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { env } from '@/env.mjs'
import { track } from '@/utils/analytics'

import { cn } from '@coursebuilder/ui/utils/cn'

type FooterProps = {
	className?: string
}

const Footer: React.FC<FooterProps> = ({ className }) => {
	return (
		<footer
			className={cn(
				'relative z-10 mt-16 flex items-center justify-center border-t border-gray-800/20  px-8 pb-24 pt-24 md:mt-0 md:pb-40 md:pt-14',
				className,
			)}
		>
			<div className="mx-auto flex w-full max-w-screen-lg items-center justify-center md:items-start md:justify-between">
				<nav
					className="flex flex-row flex-wrap gap-16 md:gap-24"
					aria-label="footer"
				>
					<div>
						<strong className="inline-block pb-5 font-mono text-sm uppercase tracking-wide">
							Learn
						</strong>
						<ul className="flex flex-col gap-2">
							<NavLink path="/workshops" label="Pro Workshops" />
							<NavLink path="/tutorials" label="Free Tutorials" />
							<NavLink path="/articles" label="Articles" />
						</ul>
					</div>
					<div>
						<strong className="inline-block pb-5 font-mono text-sm uppercase tracking-wide">
							About
						</strong>
						<ul className="flex flex-col gap-2">
							<NavLink path="/products" label="All Products" />
							<NavLink path="/faq" label="FAQ" />
							<NavLink path="/privacy" label="Policies" />
						</ul>
					</div>
					<div>
						<strong className="inline-block pb-5 font-mono text-sm uppercase tracking-wide">
							Tools
						</strong>
						<ul className="flex flex-col gap-2">
							<NavLink path="/discord" label="Discord Server" />
						</ul>
					</div>
					<div>
						<strong className="inline-block pb-5 font-mono text-sm uppercase tracking-wide">
							Contact
						</strong>
						<ul className="flex flex-col gap-2">
							<NavLink path="/contact" label="Contact Us" />
							<NavLink
								path={`mailto:${env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
								label="Email Support"
							/>
						</ul>
					</div>
				</nav>
			</div>
		</footer>
	)
}

const NavLink: React.FC<
	React.PropsWithChildren<{
		label: string | React.ReactElement
		icon?: React.ReactElement
		path?: string
		className?: string
		onClick?: () => void
	}>
> = ({ onClick, label, icon, path, className }) => {
	const router = useRouter()
	const pathname = usePathname()
	const isActive = pathname === path
	if (onClick) {
		return (
			<li className="">
				<button
					onClick={onClick}
					aria-current={isActive ? 'page' : undefined}
					className={cn(' transition hover:opacity-80', className)}
				>
					{label}
				</button>
			</li>
		)
	}
	return path ? (
		<li className="">
			<Link
				href={path}
				passHref
				className={cn('transition  hover:opacity-80', className, {
					'underline decoration-gray-600 underline-offset-4': isActive,
				})}
				onClick={() => {
					track(`clicked ${label} link in nav`)
				}}
			>
				{icon ? icon : null}
				{label}
			</Link>
		</li>
	) : null
}

export default Footer
