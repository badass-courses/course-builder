'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { cn } from '@/utils/cn'

import { getNavLinks } from '../app/get-nav-links'
import { Logo } from '../logo'
import { NavLinkItem } from './nav-link-item'
import { User } from './user'

const Navigation = () => {
	const links = getNavLinks()
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const params = useParams()
	const router = useRouter()

	const isLessonRoute = params.lesson && params.module
	const isFullWidth = Boolean(isEditRoute || isLessonRoute)
	return (
		<header
			className={cn(
				'bg-background relative z-40 flex h-[var(--nav-height)] items-center justify-between px-0 print:hidden',
				{
					'container border-x': !isFullWidth,
					'border-b': !isEditRoute,
				},
			)}
		>
			<div className="flex items-stretch">
				<span
					onContextMenu={(e) => {
						e.preventDefault()
						router.push('/brand')
					}}
				>
					<Link
						tabIndex={isRoot ? -1 : 0}
						href="/"
						className="font-heading hover:bg-border/50 flex h-[var(--nav-height)] w-full flex-col items-center justify-center px-4 text-lg font-semibold leading-none transition"
					>
						<Logo className="w-24" />
					</Link>
				</span>
				{links.length > 0 && (
					<nav
						className="flex items-stretch"
						aria-label={`Navigation header with ${links.length} links`}
					>
						<ul className="flex items-stretch">
							{links.map((link) => {
								return <NavLinkItem key={link.href || link.label} {...link} />
							})}
						</ul>
					</nav>
				)}
			</div>
			<div className="flex items-center gap-5 pr-3">
				<User />
			</div>
		</header>
	)
}

export default Navigation
