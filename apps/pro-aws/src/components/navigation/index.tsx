'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'

import { getNavLinks } from '../app/get-nav-links'
import { NavLinkItem } from './nav-link-item'
import { User } from './user'

const Navigation = () => {
	const links = getNavLinks()
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const params = useParams()
	const isLessonRoute = params.lesson && params.module
	const isFullWidth = Boolean(isEditRoute || isLessonRoute)

	return (
		<header
			className={cn(
				'bg-background relative z-40 flex h-[var(--nav-height)] items-center justify-between px-0',
				{
					'container border-x': !isFullWidth,
					'border-b': !isEditRoute,
				},
			)}
		>
			<div className="flex items-center gap-5">
				<Link
					tabIndex={isRoot ? -1 : 0}
					href="/"
					className="font-heading hover:bg-secondary flex h-[var(--nav-height)] w-[var(--nav-height)] flex-col justify-end border-r p-2.5 text-lg font-semibold leading-none"
				>
					<span>Pro</span>
					<span className="text-primary">AWS</span>
				</Link>
				{links.length > 0 && (
					<nav aria-label={`Navigation header with ${links.length} links`}>
						<ul className="flex gap-5">
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
